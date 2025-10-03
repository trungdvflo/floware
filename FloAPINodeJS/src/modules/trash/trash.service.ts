import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DeleteResult,
  FindOneOptions,
  Repository
} from 'typeorm';
import {
  ApiLastModifiedName,
  DELETED_ITEM_LAST_MODIFIED_TYPE,
  DELETED_ITEM_TYPE,
  IS_TRASHED,
  OBJ_TYPE,
  TRASH_TYPE
} from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_ID_UID_NOT_BLANK,
  MSG_ERR_NOT_EXIST,
  MSG_ERR_WHEN_CREATE,
  MSG_ERR_WHEN_UPDATE
} from '../../common/constants/message.constant';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { EmailObjectId, GeneralObjectId } from '../../common/dtos/object-uid';
import { Cloud } from '../../common/entities/cloud.entity';
import { DeletedItem } from '../../common/entities/deleted-item.entity';
import { TrashEntity } from '../../common/entities/trash.entity';
import { HeaderAuth, IReq, IUser } from '../../common/interfaces';
import { LoggerService } from '../../common/logger/logger.service';
import {
  CollectionNotificationRepository
} from '../../common/repositories/collection-notification.repository';
import { RuleRepository } from '../../common/repositories/rule.repository';
import { TrashRepository } from '../../common/repositories/trash.repository';
import { UrlRepository } from '../../common/repositories/url.repository';
import { filterDuplicateItemsWithKey, generateLastModifyItem } from '../../common/utils/common';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { TrashQueueService } from '../bullmq-queue/trash-queue.service';
import { CollectionService } from '../collection/collection.service';
import { EventNames, RecoverCollectionEvent, TrashCollectionEvent } from '../communication/events';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { SieveEmailService } from '../manual-rule/sieve.email';
import { TrashCreateDto } from './dtos/trash.create.dto';
import { TrashDeleteDto } from './dtos/trash.delete.dto';
import { TrashRecoverDto } from './dtos/trash.recover.dto';
import { TrashUpdateDto } from './dtos/trash.update.dto';

@Injectable()
export class TrashService {
  constructor(
    private readonly trashRepository: TrashRepository,
    private readonly notiRepository: CollectionNotificationRepository,
    private readonly manualRuleRepo: RuleRepository,
    @InjectRepository(DeletedItem)
    private readonly deletedItemRepository: Repository<DeletedItem>,
    private readonly deletedItem: DeletedItemService,
    private readonly queueTrash: TrashQueueService,
    private readonly logger: LoggerService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly sieveEmailService: SieveEmailService,
    private readonly collectionService: CollectionService,
    private readonly urlRepository: UrlRepository,
    @InjectRepository(Cloud)
    private readonly cloudRepository: Repository<Cloud>,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly eventEmitter: EventEmitter2
  ) { }

  private async checkObject(trash: TrashEntity, user: any): Promise<any> {
    if (trash.object_type === TRASH_TYPE.FOLDER) {
      const col = await this.collectionService.findOneById(user.userId, trash.object_id);
      return col?.id ? col : false;
    } else if (trash.object_type === TRASH_TYPE.URL) {
      const url = await this.urlRepository.findOne({
        where: {
          id: trash.object_id,
          user_id: user.userId
        }
      });
      return url?.id ? url : false;
    } else if (trash.object_type === TRASH_TYPE.CSFILE) {
      const cloud = await this.cloudRepository.findOne({
        where: {
          id: trash.object_id,
          user_id: user.userId
        }
      });
      return cloud?.id ? cloud : false;
    } else {
      return true;
    }
  }

  private filterReponse(trash: TrashEntity) {
    let object_uid;
    try {
      if (trash.object_uid) {
        if (trash.object_type === TRASH_TYPE.EMAIL) {
          object_uid = new EmailObjectId({ emailBuffer: trash.object_uid }).getPlain();
        } else if (trash.object_uid) {
          object_uid = new GeneralObjectId({ uidBuffer: trash.object_uid }).getPlain();
        }
        trash.object_uid = object_uid || trash.object_uid;
      }
      if (trash['old_object_uid'] && trash.object_type === TRASH_TYPE.EMAIL) {
        trash['old_object_uid'] = new EmailObjectId({
          emailBuffer: trash['old_object_uid']
        }).getPlain();
      }

    } catch (e) {
      this.logger.logError(e);
    }
    delete trash.user_id;
    return trash;
  }

  async findAll(filter: BaseGetDTO, { user, headers }: IReq): Promise<any> {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const trashs: TrashEntity[] = await this.databaseUtilitiesService.getAll({
      userId: user.userId,
      filter,
      repository: this.trashRepository
    });

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(user.userId, DELETED_ITEM_TYPE.TRASH, {
        ids,
        modified_gte,
        modified_lt,
        page_size
      });
    }

    return {
      data: trashs.map(trash => this.filterReponse(trash)),
      data_del: deletedItems
    };
  }

  private createTrashItem(
    value: TrashCreateDto,
    createDate: number,
    user: { userId: number },
    errors: { message: string; code: ErrorCode; attributes: any }[],
  ) {
    if (!value.object_id && !value.object_uid) {
      errors.push({
        message: MSG_ERR_ID_UID_NOT_BLANK,
        code: ErrorCode.INVALID_DATA,
        attributes: value,
      });
      return;
    }
    let trash_time = value.trash_time;
    if (!trash_time) {
      trash_time = createDate;
    }
    const trash = this.trashRepository.create({
      user_id: user.userId,
      trash_time,
      object_id: value.object_id,
      object_type: value.object_type,
      object_href: value.object_href,
      created_date: createDate,
      updated_date: createDate
    });
    if (value.object_uid) {
      trash.object_uid = value.object_uid.objectUid;
    }
    if (value.old_object_uid) {
      trash["old_object_uid"] = value.old_object_uid.objectUid;
    }
    trash['ref'] = value.ref;
    return trash;
  }

  async saveBatch(
    data: TrashCreateDto[],
    errors: any,
    { user, headers }: IReq,
  ): Promise<{ results: any; errors: any }> {

    const results = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    const colIds = [];

    await Promise.all(
      data.map(async (trashItem, idx) => {
        const dateItem = getUpdateTimeByIndex(currentTime, idx);
        const trashEntity = this.createTrashItem(trashItem, dateItem, user, errors);
        if (!trashEntity) return;
        try {
          const obj = await this.checkObject(trashEntity, user);
          if (!obj) {
            throw new Error(MSG_ERR_NOT_EXIST);
          }
          const res = await this.save(trashEntity, obj, user.email);
          if (res?.id) {
            timeLastModify.push(dateItem);
            results.push(res);
            if (trashEntity.object_type === TRASH_TYPE.FOLDER) {
              colIds.push(trashEntity.object_id);
            }
          } else {
            errors.push({
              message: MSG_ERR_WHEN_CREATE,
              code: ErrorCode.INVALID_DATA,
              attributes: trashItem,
            });
            this.logger.logError(res);
            return res;
          }
        } catch (err) {
          errors.push({
            message: err.sqlMessage ? err.sqlMessage : err.message,
            code: ErrorCode.BAD_REQUEST,
            errno: err.errno,
            attributes: trashItem,
          });
          this.logger.logError(err);
        }
      }),
    );
    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.TRASH,
        userId: user.userId,
        email: user.email,
        updatedDate
      }, headers);
    }
    await this.sieveEmailService.trashRuleByCollection(
      colIds, user.userId, user.email
      , this.manualRuleRepo
      , this.apiLastModifiedQueueService
      , IS_TRASHED.TRASHED
    );

    return { results, errors };
  }

  async save(trashInfo: TrashEntity, obj, email?: string): Promise<any> {
    if (!trashInfo.object_uid && obj.uid) {
      trashInfo.object_uid = obj.uid;
    }
    const trash = await this.trashRepository.insert(trashInfo);
    if (!trash || !trash.raw || !trash.raw.insertId) {
      throw new Error(MSG_ERR_NOT_EXIST);
    }
    const trashRes = {
      id: trash.raw.insertId,
      ...trashInfo,
      col_type: obj["type"]
    };
    await this.queueTrash.afterCreated({ ...trashRes, email });
    // emit event trash collection
    if (trashInfo.object_type === TRASH_TYPE.FOLDER) {
      this.eventEmitter.emit(EventNames.TRASH_COLLECTION,
        { collection: obj, email } as TrashCollectionEvent);
    }
    return this.filterReponse(trashRes);
  }

  async updateBatch(
    data: TrashUpdateDto[],
    errors: any,
    { user, headers }: IReq,
  ): Promise<{ results: any; errors: any }> {
    const trashInfos = [];
    data.forEach((value, index, arr) => {
      const trash = {};
      trash['id'] = value.id;
      if (value.trash_time) {
        trash['trash_time'] = value.trash_time;
      }
      if (value.object_type) {
        trash['object_type'] = value.object_type;
      }
      if (value.object_uid) {
        trash['object_uid'] = value.object_uid.objectUid;
      }
      if (value.object_href) {
        trash['object_href'] = value.object_href;
      }
      trashInfos.push(trash);
    });
    const results = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    await Promise.all(
      trashInfos.map(async (upTrashItem, idx) => {
        let upRes: any;
        try {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          upTrashItem.updated_date = dateItem,
            upRes = await this.update(upTrashItem, user);
          if (upRes?.id) {
            timeLastModify.push(dateItem);
            results.push(upRes);
          } else {
            errors.push({
              message: MSG_ERR_WHEN_UPDATE,
              code: ErrorCode.INVALID_DATA,
              attributes: this.filterReponse(upTrashItem),
            });
            this.logger.logError(upRes);
            return upRes;
          }
        } catch (err) {
          errors.push({
            message: err.sqlMessage,
            code: ErrorCode.BAD_REQUEST,
            errno: err.errno,
            attributes: this.filterReponse(upTrashItem),
          });
          this.logger.logError(err);
        }
        return upRes;
      }),
    );
    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.TRASH,
        userId: user.userId,
        email: user.email,
        updatedDate
      }, headers);
    }

    return { results, errors };
  }

  async update(trashInfo: TrashEntity, user: any): Promise<any> {
    const upResult = await this.trashRepository.update(
      {
        id: trashInfo.id,
        user_id: user.userId,
      },
      trashInfo,
    );

    if (upResult && upResult.affected === 1) {
      return trashInfo;
    } else {
      return upResult;
    }
  }

  async deleteBatch(
    data: TrashDeleteDto[],
    delTrashErrors: any[],
    { user, headers }: IReq,
  ): Promise<{ results: any; errors: any }> {
    const filterData = filterDuplicateItemsWithKey(data, ['id']);
    if (filterData && filterData.dataError.length > 0) {
      filterData.dataError.map(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        delTrashErrors.push(errItem);
        return errItem;
      });
    }
    const results = [];
    const timeLastModify = [];
    let timeLastModifyNoti = [];
    const currentTime = getUtcMillisecond();
    if (filterData && filterData.dataPassed.length > 0) {
      const lastData = filterData.dataPassed;
      await Promise.all(
        lastData.map(async (delTrashItem, index) => {
          let result: any;
          try {
            const dateItem = getUpdateTimeByIndex(currentTime, index);
            result = await this.delete(delTrashItem, user, headers, dateItem);
            if (result?.id) {
              timeLastModify.push(dateItem);
              results.push({ id: result.id });
              const colId = await this.notiRepository
                .createNotiAfterDelete(result, user.email, dateItem);
              if (colId > 0) {
                timeLastModifyNoti = generateLastModifyItem(timeLastModifyNoti,
                  colId, dateItem);
              }
            } else {
              delTrashErrors.push({
                message: result,
                code: ErrorCode.OBJECT_NOT_EXIST,
                attributes: delTrashItem,
              });
              this.logger.logError(result);
              return result;
            }
          } catch (err) {
            delTrashErrors.push({
              message: err.sqlMessage,
              code: ErrorCode.BAD_REQUEST,
              errno: err.errno,
              attributes: delTrashItem,
            });
            this.logger.logError(err);
          }
          return result;
        }),
      );
    }
    if (results.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.TRASH,
        userId: user.userId,
        email: user.email,
        updatedDate
      }, headers);
    }
    this.apiLastModifiedQueueService
      .sendLastModifiedByCollectionId(timeLastModifyNoti,
        ApiLastModifiedName.COLLECTION_ACTIVITY, headers);

    return { results, errors: delTrashErrors };
  }

  async delete(item: TrashDeleteDto, user: IUser,
    headers: HeaderAuth, updatedTime: number): Promise<any> {
    // find trash objects
    const trash = await this.trashRepository.findOne({ where: item });
    if (trash?.id && trash?.user_id === user.id) {
      // create deleted item
      const deletedItem = new DeletedItem();
      deletedItem.created_date = updatedTime;
      deletedItem.updated_date = updatedTime;
      deletedItem.is_recovery = 0;
      deletedItem.item_id = trash.id;
      deletedItem.item_type = DELETED_ITEM_TYPE.TRASH;
      deletedItem.user_id = trash.user_id;
      // delete trash object
      await this.trashRepository.remove(trash);
      // keep id
      trash.id = item.id;
      await this.queueTrash.afterDeleted({ ...trash, email: user.email });
      // save deleted items
      await this.deletedItemRepository.insert(deletedItem);
      // Add queue
      const deletedItemLastModifiedType = DELETED_ITEM_LAST_MODIFIED_TYPE[trash.object_type];
      if (deletedItemLastModifiedType) {
        this.apiLastModifiedQueueService.addJob({
          apiName: deletedItemLastModifiedType,
          userId: trash.user_id,
          email: user.email,
          updatedDate: updatedTime
        }, headers);
      }
    } else {
      return MSG_ERR_NOT_EXIST;
    }

    return trash;
  }

  async recoverBatch(
    trashs: TrashRecoverDto[],
    recErrors: any[],
    { user, headers }: IReq,
  ): Promise<{ results: any; errors: any }> {
    const filterData = filterDuplicateItemsWithKey(trashs, ['id']);

    if (filterData && filterData.dataError.length > 0) {
      filterData.dataError.map(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        recErrors.push(errItem);
        return errItem;
      });
    }
    const _now = Date.now();
    const updatedDates = [];
    const results = [];
    const colIds = [];
    if (filterData && filterData.dataPassed.length > 0) {
      const lastData = filterData.dataPassed;
      await Promise.all(
        lastData.map(async (recItem, index) => {
          let result: any;
          try {
            const updatedDate = (_now + index) / 1000;
            result = await this.recover(recItem, user, headers, updatedDate);
            if (result?.id) {
              updatedDates.push(updatedDate);
              results.push(recItem);
              if (result.object_type === TRASH_TYPE.FOLDER) {
                colIds.push(result.object_id);
              }
            } else {
              recErrors.push({
                message: result,
                code: ErrorCode.OBJECT_NOT_EXIST,
                attributes: recItem,
              });
              this.logger.logError(result);
              return result;
            }
          } catch (err) {
            recErrors.push({
              message: err.sqlMessage ? err.sqlMessage : err.message,
              code: ErrorCode.BAD_REQUEST,
              errno: err.errno,
              attributes: recItem,
            });
            this.logger.logError(err);
          }
          return result;
        }),
      );
    }
    if (results.length > 0) {
      const updatedDate = Math.max(...updatedDates);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.TRASH,
        userId: user.userId,
        email: user.email,
        updatedDate
      }, headers);
    }
    await this.sieveEmailService.trashRuleByCollection(
      colIds, user.userId, user.email
      , this.manualRuleRepo
      , this.apiLastModifiedQueueService
      , IS_TRASHED.NOT_TRASHED
    );

    return { results, errors: recErrors };
  }

  async recover(item: TrashRecoverDto, user, headers, created_date: number): Promise<any> {
    let delResult: DeleteResult = null;
    // find trash objects
    const trash = await this.trashRepository.findOne({
      where: {
        id: item.id,
        user_id: user.userId,
      }
    });
    if (trash?.id) {
      // create deleted item
      const deletedItem = new DeletedItem();
      deletedItem.created_date = created_date;
      deletedItem.updated_date = deletedItem.created_date;
      deletedItem.is_recovery = 1;
      deletedItem.item_id = trash.id;
      deletedItem.item_type = DELETED_ITEM_TYPE.TRASH;
      deletedItem.user_id = trash.user_id;
      // delete trash object
      delResult = await this.trashRepository.delete({
        id: item.id,
        user_id: user.userId,
      });
      if (item.new_object_uid) {
        trash["new_object_uid"] = item.new_object_uid.objectUid;
      }
      await this.queueTrash.afterRecovered({ ...trash, email: user.email });
      // save deleted items
      await this.deletedItemRepository.insert(deletedItem);

      // Add queue
      const deletedTtemLastModifiedType = DELETED_ITEM_LAST_MODIFIED_TYPE[trash.object_type];
      if (deletedTtemLastModifiedType) {
        this.apiLastModifiedQueueService.addJob({
          apiName: deletedTtemLastModifiedType,
          userId: trash.user_id,
          email: user.email,
          updatedDate: deletedItem.updated_date
        }, headers);
      }

      // emit event recover collection
      if (trash.object_type === TRASH_TYPE.FOLDER) {
        const collection = await this.collectionService.findOneById(user.userId, trash.object_id);
        if (collection?.id) {
          this.eventEmitter.emit(EventNames.RECOVER_COLLECTION,
            { collection, email: user.email } as RecoverCollectionEvent);
        }
      }

    } else {
      return MSG_ERR_NOT_EXIST;
    }

    if (delResult && delResult.affected === 1) {
      delete item["new_object_uid"];
      return trash;
    } else {
      return delResult;
    }
  }

  async getIsTrash(is_trashed: number,
    obj_uid: Buffer, obj_type: OBJ_TYPE | string, obj_href?: string)
    : Promise<number> {
    if (is_trashed || is_trashed === 0) {
      return is_trashed;
    }
    if (!(Object.values(TRASH_TYPE) as string[]).includes(obj_type as string)) {
      return is_trashed;
    }
    const cond: FindOneOptions<TrashEntity> = {
      where: {
        object_uid: obj_uid,
        object_type: obj_type
      }
    };
    if (obj_href) {
      cond.where["object_href"] = obj_href;
    }
    const obj = await this.trashRepository.findOne(cond);
    return (obj?.id) ? IS_TRASHED.TRASHED : IS_TRASHED.NOT_TRASHED;
  }

}
