import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import {
  ApiLastModifiedName,
  DELETED_ITEM_TYPE
} from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_NOT_EXIST,
  MSG_ERR_WHEN_CREATE,
  MSG_ERR_WHEN_UPDATE,
  SortObjectResponseMessage
} from '../../common/constants/message.constant';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { Url } from '../../common/entities/urls.entity';
import { IReq } from '../../common/interfaces';
import { LoggerService } from '../../common/logger/logger.service';
import { UrlRepository } from '../../common/repositories/url.repository';
import {
  generateMinusOrderNum,
  generateOutOfOrderRangeFailItem, getMinTable, memberIDWithoutDuplicates
} from '../../common/utils/common';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { SORT_OBJECT, SORT_OBJECT_TYPE } from '../sort-object/sort-object.constant';
import { SortObjectService } from '../sort-object/sort-object.service';
import { UrlCreateError, UrlsCreateDto } from './dtos/urls.create.dto';
import { UrlDeleteDto } from './dtos/urls.delete.dto';
import { UrlsUpdateDto } from './dtos/urls.update.dto';

@Injectable()
export class UrlsService {
  constructor(
    private readonly urlsRepository: UrlRepository,
    private readonly deletedItem: DeletedItemService,
    private readonly logger: LoggerService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly sortObjectService: SortObjectService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
  ) { }

  async getMaxOrder(user: any) {
    const query = this.urlsRepository.createQueryBuilder('urls');
    query.select('MAX(urls.order_number)', 'max');
    query.where('urls.user_id = :uId', { uId: user.userId });
    const result = await query.getRawOne();
    return result.max;
  }

  getById(id: number, user_id: number): Promise<Url> {
    return this.urlsRepository.findOne({ where: { id, user_id } });
  }

  async getAllFiles(filter: BaseGetDTO, { user, headers }: IReq) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const collections: Url[] = await this.databaseUtilitiesService.getAll({
      userId: user.id,
      filter,
      repository: this.urlsRepository
    });

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(user.id, DELETED_ITEM_TYPE.URL, {
        ids,
        modified_gte,
        modified_lt,
        page_size
      });
    }

    return {
      data: collections,
      data_del: deletedItems
    };
  }

  async saveBatch(data: UrlsCreateDto[], errs: any, { user, headers }: IReq)
    : Promise<{ results: any, errors: any }> {
    const isRunning = await this.sortObjectService.
      isResetOrderRunning(user.userId, SORT_OBJECT_TYPE.URL.toString());
    const results = [];
    if (isRunning) {
      return {
        results,
        errors: [...errs, ...data.map((i) => {
          return buildFailItemResponse(ErrorCode.BAD_REQUEST,
            SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS, i);
        })],
      };
    }
    const minNumber = await getMinTable(this.urlsRepository, 'order_number', user.userId);
    const currentTime = getUtcMillisecond();
    const timeLastModify: number[] = [];

    await Promise.all(data.map(async (value, idx) => {
      try {
        const getMinByIndex: number = Number(generateMinusOrderNum(minNumber, idx));
        if (getMinByIndex < SORT_OBJECT.MIN_ORDER_NUMBER) {
          errs.push(generateOutOfOrderRangeFailItem(value));
          return false; // This will skip current element
        }
        const dateItem = getUpdateTimeByIndex(currentTime, idx);
        timeLastModify.push(dateItem);
        const urlEntity = this.urlsRepository.create({
          user_id: user.userId,
          uid: uuid(),
          url: value.url,
          title: value.title,
          recent_date: value.recent_date ? value.recent_date : dateItem,
          order_number: getMinByIndex,
          is_trashed: value.is_trashed,
          created_date: dateItem,
          updated_date: dateItem,
          order_update_time: dateItem
        });
        const result = await this.urlsRepository.insert(urlEntity);
        results.push({
          id: result.raw.insertId,
          ...urlEntity,
          user_id: undefined,
          ref: value.ref
        });
      } catch (err) {
        if (err instanceof UrlCreateError) {
          errs.push({
            message: MSG_ERR_WHEN_CREATE,
            code: ErrorCode.INVALID_DATA,
            attributes: value,
          });
        } else {
          errs.push({
            message: err.sqlMessage,
            code: ErrorCode.BAD_REQUEST,
            errno: err.errno,
            attributes: value,
          });
        }
        this.logger.logError(err);
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.URL,
        userId: user.userId,
        email: user.email,
        updatedDate
      }, headers);
    }

    return {
      results,
      errors: errs,
    };
  }

  async save(item: Url, { user, headers }: IReq): Promise<Url> {
    return this.urlsRepository.save(item);
  }

  async updateBatch(data: UrlsUpdateDto[], upErrors: any, { user, headers }: IReq)
    : Promise<{ results: any, errors: any }> {
    const results = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    const lastModifyMembers = [];

    await Promise.all(data.map(async (uitem, idx) => {
      try {
        const itemDb = await this.urlsRepository.findOne({
          where: { id: uitem.id, user_id: user.userId }
        });
        if (!itemDb || !itemDb.id) {
          upErrors.push({
            message: MSG_ERR_WHEN_UPDATE,
            code: ErrorCode.INVALID_DATA,
            attributes: uitem
          });
          this.logger.logError(upErrors);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(dateItem);

          await this.urlsRepository.update(
            { id: uitem.id }, { ...uitem, updated_date: dateItem });
          results.push({ ...itemDb, ...uitem, updated_date: dateItem });

          const colIds = await this.urlsRepository.getShareColIds([uitem.id]);
          for (const colId of colIds) {
            const memberIds = await this.urlsRepository
              .getShareMembersByCollectionId(colId);
            memberIds.forEach(memberId => {
              lastModifyMembers.push({ memberId, updatedDate: dateItem });
            });
          }
        }
      } catch (err) {
        upErrors.push({
          message: err.sqlMessage,
          code: ErrorCode.BAD_REQUEST,
          errno: err.errno,
          attributes: uitem
        });
        this.logger.logError(err);
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.URL,
        userId: user.userId,
        email: user.email,
        updatedDate
      }, headers);
      const removeDuplicateMemberIds = memberIDWithoutDuplicates(lastModifyMembers);
      // push last modify for each member
      await Promise.all(removeDuplicateMemberIds.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.URL_MEMBER,
          userId: item.memberId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      }));
    }
    return {
      results,
      errors: upErrors
    };
  }

  async deleteBatch(data: UrlDeleteDto[], delErrs: any, { user, headers }: IReq)
    : Promise<{ results: any, errors: any }> {
    const urlInfos = [];
    data.forEach((value, index, arr) => {
      const url = {
        id: value.id,
      };
      urlInfos.push(url);
    });

    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    const lastModifyMembers = [];
    const results = [];
    const deletedItems = [];
    await Promise.all(urlInfos.map(async (uitem, idx) => {
      let result: any;
      try {
        const dateItem = getUpdateTimeByIndex(currentTime, idx);
        const colIds = await this.urlsRepository.getShareColIds([uitem.id]);
        result = await this.delete(uitem, user.userId, dateItem);
        if (!result || !result.id) {
          delErrs.push({
            message: result,
            code: ErrorCode.OBJECT_NOT_EXIST,
            attributes: uitem
          });
          this.logger.logError(result);
          return result;
        }
        timeLastModify.push(dateItem);
        for (const colId of colIds) {
          /* Move logic to trash delete
          const memberIds = await this.urlsRepository
          .getShareMembersByCollectionId(colId);
          memberIds.forEach(memberId => {
            lastModifyMembers.push({ memberId, updatedDate: dateItem});
            deletedItems.push({
              item_type: DELETED_ITEM_TYPE.URL_MEMBER,
              item_id: uitem.id,
              item_uid: result.uid,
              user_id: memberId,
              created_date: dateItem,
              updated_date: dateItem,
            });
          }); */
        }
        results.push({ id: result.id });
      } catch (err) {
        delErrs.push({
          message: err.sqlMessage,
          code: ErrorCode.BAD_REQUEST,
          errno: err.errno,
          attributes: uitem
        });
        this.logger.logError(err);
      }
      return result;
    }));
    await this.deletedItem.createMultiple(deletedItems);
    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.URL,
        userId: user.userId,
        email: user.email,
        updatedDate
      }, headers);
      /* Move logic to trash delete
      const removeDuplicateMemberIds = memberIDWithoutDuplicates(lastModifyMembers);
      // push last modify for each member
      await Promise.all(removeDuplicateMemberIds.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.URL_MEMBER,
          userId: item.memberId,
          updatedDate: item.updatedDate
        });
      })); */
    }
    return {
      results,
      errors: delErrs
    };
  }

  async delete(item: Url, userId: number, dateItem: number): Promise<any> {
    // find url objects
    const url = await this.urlsRepository.findOne({
      where: { id: item.id, user_id: userId }
    });
    if (!url) {
      return MSG_ERR_NOT_EXIST;
    }

    await this.urlsRepository.delete(
      { id: url.id }
    );
    // save deleted items
    await this.deletedItem.create(userId, {
      item_id: url.id,
      item_uid: url.uid,
      item_type: DELETED_ITEM_TYPE.URL,
      is_recovery: 0,
      created_date: dateItem,
      updated_date: dateItem
    });
    // TODO: remove these lines if QA check ok
    // await this.deleteObjectQueueService.addJob({
    //   userId,
    //   objectUid: url.uid,
    //   objectType: OBJ_TYPE.URL,
    //   objectId: url.id,
    // });
    return url;
  }
}