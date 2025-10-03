import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, In, QueryFailedError, Repository } from 'typeorm';
import { format } from 'util';
import {
  APP_IDS,
  ApiLastModifiedName,
  COLLECTION_ALLOW_TYPE,
  COLLECTION_TYPE,
  DELETED_ITEM_TYPE,
  OBJ_TYPE,
  SHARE_STATUS
} from '../../../common/constants/common';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_ERR_LINK } from '../../../common/constants/message.constant';
import { GetLinkedPaging } from '../../../common/dtos/get-all-filter';
import { LINK_OBJ_TYPE } from '../../../common/dtos/object-uid';
import { Collection } from '../../../common/entities/collection.entity';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { KanbanCard } from '../../../common/entities/kanban-card.entity';
import { LinkedCollectionObject } from '../../../common/entities/linked-collection-object.entity';
import { ShareMember } from '../../../common/entities/share-member.entity';
import { Url } from '../../../common/entities/urls.entity';
import { IReq, IUser } from '../../../common/interfaces';
import { IDeleteItem } from '../../../common/interfaces/delete-item.interface';
import { LoggerService } from '../../../common/logger/logger.service';
import { CollectionActivityRepository } from '../../../common/repositories/collection-activity.repository';
import { LinkedCollectionObjectRepository } from '../../../common/repositories/linked-collection-object.repository';
import { memberIDWithoutDuplicates, pickObject } from '../../../common/utils/common';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../../common/utils/date.util';
import { buildFailItemResponse } from '../../../common/utils/respond';
import { ApiLastModifiedQueueService, LastModifiedMember } from '../../../modules/bullmq-queue/api-last-modified-queue.service';
import { TrashService } from '../../../modules/trash/trash.service';
import { CollectionService } from '../../collection/collection.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { GlobalSettingService as SettingService } from '../../setting/setting.service';
import { ThirdPartyAccountService } from '../../third-party-account/third-party-account.service';
import { LinkHelper } from '../helper/link.helper';
import { LinkedCollectionWithRef } from './dtos/create-linked-collection.response';
import { DeleteLinkedCollectionObjectDto } from './dtos/delete-linked-collection-object.dto';
import { LinkedCollectionParamError } from './dtos/error.dto';
import { LinkedCollectionObjectDto } from './dtos/linked-collection-object.dto';

export interface LinkedCollectionObjectServiceOptions {
  fields: (keyof LinkedCollectionObject)[];
}

@Injectable()
export class LinkedCollectionObjectService {
  constructor(
    @InjectRepository(KanbanCard)
    private readonly kanbanCardRepo: Repository<KanbanCard>,
    @InjectRepository(LinkedCollectionObject)
    private readonly linkedCollectionObject: Repository<LinkedCollectionObject>,
    private readonly deletedItemService: DeletedItemService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly thirdPartyAccountService: ThirdPartyAccountService,
    private readonly logger: LoggerService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly collectionService: CollectionService,
    private readonly trashService: TrashService,
    private readonly settingService: SettingService,
    private readonly collectionActivityRepo: CollectionActivityRepository,
    private readonly linkedCollectionObjectRepo: LinkedCollectionObjectRepository,
    @InjectRepository(ShareMember)
    private readonly shareMember: Repository<ShareMember>,
  ) { }
  async findOne(user_id: number, id: number) {
    try {
      return this.linkedCollectionObject.findOne({ where: { user_id, id } });
    } catch (err) {
      // TODO: log error here
      throw err;
    }
  }
  // this method retrieves all entries
  async findAll(user: IUser, filter?: GetLinkedPaging<LinkedCollectionObject>) {
    const fields = filter.fields;
    delete filter.fields;
    filter.remove_deleted = true;
    const _links = user.appId === APP_IDS.web
      ? await this.linkedCollectionObjectRepo.getLinkedSupportChannel({
        repository: this.linkedCollectionObject,
        filter, userId: user.id
      })
      : await this.databaseUtilitiesService.getAll({
        repository: this.linkedCollectionObject,
        filter, userId: user.id
      });
    const links = _links.map((item: LinkedCollectionObject) => {
      return {
        ...item,
        object_uid: LinkHelper.getObjectUid(item.object_uid, item.object_type),
      };
    });
    // deleted items
    const { modified_gte, modified_lt, ids, page_size } = filter;
    let deletedItems: DeletedItem[] = [];
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItemService
        .findAll(user.id, DELETED_ITEM_TYPE.COLLECTION_LINK, {
          modified_gte,
          modified_lt,
          ids,
          page_size
        });
    }
    return {
      links: pickObject(links, fields),
      deletedItems
    };
  }
  async create(userId: number, newCollectionLink: LinkedCollectionObjectDto, dateItem: number):
    Promise<LinkedCollectionObject> {
    const obj = {
      user_id: userId,
      collection_id: newCollectionLink.collection_id,
      object_uid: newCollectionLink.object_uid.objectUid,
      object_type: newCollectionLink.object_type,
      account_id: newCollectionLink.account_id,
      object_href: newCollectionLink.object_href,
      email_time: newCollectionLink.email_time || 0,
      is_trashed: await this.trashService.getIsTrash(
        newCollectionLink.is_trashed,
        newCollectionLink.object_uid.objectUid,
        newCollectionLink.object_type,
        newCollectionLink.object_href),
      created_date: dateItem,
      updated_date: dateItem,
    };
    const colEntity = this.linkedCollectionObject.create(obj);

    return this.linkedCollectionObject.save(colEntity);
  }
  async createBatchLinks(
    linkParams: LinkedCollectionObjectDto[],
    { user, headers }: IReq
  ): Promise<{
    created: LinkedCollectionWithRef[];
    errors: LinkedCollectionParamError[];
  }> {
    const errors: LinkedCollectionParamError[] = [];
    const existedItems = await this.collectionService
      .findByIds(user.id, linkParams.map(e => e.collection_id), { fields: ['id', 'type'] });
    const notExistedCollectionIds: number[] = [];
    linkParams = linkParams.filter(item => {
      const foundIndex = existedItems.findIndex(col => col.id === item.collection_id);
      if (foundIndex !== -1) {
        item['col_type'] = existedItems[foundIndex].type;
        return item;
      } else {
        notExistedCollectionIds.push(item.collection_id);
      }
    });

    notExistedCollectionIds.forEach(collectionId => {
      errors.push(new LinkedCollectionParamError({
        attributes: { collection_id: collectionId },
        code: ErrorCode.COLLECTION_NOT_FOUND,
        message: MSG_ERR_LINK.COLLECTION_NOT_EXIST,
      }));
    });
    const currentTime = getUtcMillisecond();
    const timeLastModify: number[] = [];
    const lastModifyMembers: LastModifiedMember[] = [];
    const lastModifyUrlMembers: LastModifiedMember[] = [];

    const createdLinks: LinkedCollectionWithRef[] = await Promise.all(
      linkParams.map(async (linkParam, idx) => {
        try {
          const updatedDate = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(updatedDate);
          if (linkParam.account_id > 0) {
            const isExisted = await this.thirdPartyAccountService.isExist(
              user.id,
              linkParam.account_id);
            if (isExisted === 0) {
              throw new LinkedCollectionParamError({
                code: ErrorCode.ACCOUNT_NOT_FOUND,
                message: format(MSG_ERR_LINK.INVALID_ACCOUNT_ID, 'account_id'),
                attributes: { account_id: linkParam.account_id },
              });
            }
          }
          const newLink = await this.create(user.id, linkParam, updatedDate);
          if (linkParam['col_type'] === COLLECTION_TYPE.SHARE_COLLECTION) {
            // all members
            const allMembers = await this.shareMember.find({
              where: {
                collection_id: linkParam.collection_id,
                shared_status: SHARE_STATUS.JOINED
              }
            });
            allMembers.forEach(member => {
              lastModifyMembers.push({
                memberId: member.member_user_id,
                email: member.shared_email,
                updatedDate
              });
              if (newLink.object_type === OBJ_TYPE.URL) {
                lastModifyUrlMembers.push({
                  memberId: member.member_user_id,
                  email: member.shared_email,
                  updatedDate
                });
              }
            });
          }
          return new LinkedCollectionWithRef({
            id: newLink.id,
            collection_id: newLink.collection_id,
            object_uid: LinkHelper.getObjectUid(newLink.object_uid, newLink.object_type),
            object_type: newLink.object_type,
            account_id: newLink.account_id,
            object_href: newLink.object_href,
            is_trashed: newLink.is_trashed,
            created_date: newLink.created_date,
            updated_date: newLink.updated_date,
            email_time: newLink.email_time,
            ref: linkParam.ref
          });
        } catch (err) {
          this.handleError(err, ErrorCode.CREATE_FAILED, errors, linkParam);
        }
      }),
    );

    const successLinks = createdLinks.filter(Boolean);
    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.LINKED_COLLECTION_OBJECT,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }
    const removeDuplicateMembers = memberIDWithoutDuplicates(lastModifyMembers);
    await Promise.all(removeDuplicateMembers.map(async (item) => {
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.LINKED_COLLECTION_OBJECT_MEMBER,
        userId: item.memberId,
        email: item.email,
        updatedDate: item.updatedDate
      }, headers);
    }));
    const removeDuplicateUrlMembers = memberIDWithoutDuplicates(lastModifyUrlMembers);
    await Promise.all(removeDuplicateUrlMembers.map(async (item) => {
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.URL_MEMBER,
        userId: item.memberId,
        email: item.email,
        updatedDate: item.updatedDate
      }, headers);
    }));
    return {
      created: successLinks,
      errors,
    };
  }

  async deleteBatchLinks(linkParams: DeleteLinkedCollectionObjectDto[], { user, headers }: IReq) {
    const kanbanCardIds = [];
    const itemPass = [];
    const itemFail = [];
    const insertDeletedItemLinks: IDeleteItem[] = [];
    const insertDeletedItemKanbanCards: IDeleteItem[] = [];
    const timeLastModify = [];
    const lastModifyMembers = [];
    const lastModifyUrlMembers = [];
    const currentTime = getUtcMillisecond();
    await Promise.all(linkParams.map(async (item, idx) => {
      try {
        const errLik = MSG_ERR_LINK.LINK_NOT_EXIST;
        const lsKanban = await this.linkedCollectionObject.createQueryBuilder('lco')
          .select(['lco.id as lcoID', 'lco.collection_id collectionId',
            'lco.object_uid as objectUid', 'lco.object_type as objectType', 'u.id as objectId'])
          .addSelect('co.type', 'collectionType')
          .addSelect(`kc.id`, 'kanbanCardId')
          .addSelect(`kc.user_id`, 'kbUserId')
          .innerJoin(Collection, 'co', 'co.id = lco.collection_id')
          .leftJoin(Url, 'u', 'u.uid = lco.object_uid')
          .leftJoin(KanbanCard, 'kc', 'kc.object_uid = lco.object_uid AND kc.object_type = lco.object_type')
          .where(`lco.id = :id`, { id: item.id })
          .andWhere(`lco.user_id = :userId`, { userId: user.userId }).execute();

        if (lsKanban.length === 0) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
            errLik, item);
          return itemFail.push(errItem);
        }
        const { objectId, objectUid, objectType, collectionId, collectionType } = lsKanban[0];
        // remove item
        const deleteItemlco = await this.linkedCollectionObject
          .delete({ id: item.id, user_id: user.userId });

        if (!deleteItemlco || deleteItemlco.affected === 0) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, errLik, item);
          itemFail.push(errItem);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(dateItem);
          insertDeletedItemLinks.push({
            user_id: user.userId,
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.COLLECTION_LINK,
            created_date: dateItem,
            updated_date: dateItem
          });
          // remove item kanban card
          lsKanban.forEach(kbCard => {
            const kanbanCardId = kbCard.kanbanCardId;
            if (kanbanCardId > 0) {
              insertDeletedItemKanbanCards.push({
                user_id: kbCard.kbUserId,
                item_id: kanbanCardId,
                item_type: DELETED_ITEM_TYPE.CANVAS,
                created_date: dateItem,
                updated_date: dateItem
              });
              kanbanCardIds.push(kanbanCardId);
            }
          });
          if (collectionType === COLLECTION_ALLOW_TYPE.SharedCollection) {
            // update all activity follow collection_id after delete link
            const setting = await this.settingService.findOneByUserId(user.userId,
              { fields: ['omni_cal_id'] });
            const updateActivity = {
              collection_id: 0
            };

            updateActivity['object_href'] = objectType.toString('utf8') === OBJ_TYPE.URL
              ? ''
              : `/calendarserver.php/calendars/${user.email}/${setting.omni_cal_id}/${objectUid}.ics`;

            await this.collectionActivityRepo.update({
              user_id: user.userId,
              collection_id: collectionId,
              object_uid: objectUid,
            }, updateActivity);

            // all members
            const allMembers = await this.shareMember.find({
              where: {
                collection_id: collectionId,
                shared_status: SHARE_STATUS.JOINED
              }
            });
            allMembers.forEach(member => {
              lastModifyMembers.push({
                memberId: member.member_user_id,
                email: member.shared_email,
                updatedDate: dateItem
              });
              if (objectType.toString('utf8') === OBJ_TYPE.URL) {
                lastModifyUrlMembers.push({
                  memberId: member.member_user_id,
                  email: member.shared_email,
                  updatedDate: dateItem
                });
                insertDeletedItemLinks.push({
                  user_id: member.member_user_id,
                  item_id: objectId,
                  item_uid: objectUid,
                  item_type: DELETED_ITEM_TYPE.URL_MEMBER,
                  created_date: dateItem,
                  updated_date: dateItem
                });
              }
            });
          }
          itemPass.push({ id: item.id, collectionId });
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        this.logger.logError(error);
        itemFail.push(errItem);
      }
    }));

    if (itemPass.length > 0) {
      await this.deletedItemService.createMultiple(insertDeletedItemLinks);
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.LINKED_COLLECTION_OBJECT,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
      if (kanbanCardIds.length > 0) {
        await this.kanbanCardRepo.delete({ id: In(kanbanCardIds) });
        await this.deletedItemService.createMultiple(insertDeletedItemKanbanCards);
        await this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.KANBAN_CARD,
          userId: user.id,
          email: user.email,
          updatedDate
        }, headers);

        await this.apiLastModifiedQueueService.addJobCollection({
          apiName: ApiLastModifiedName.KANBAN_CARD_MEMBER,
          userId: user.id,
          updatedDate,
          collectionId: itemPass[0].collectionId
        }, headers);
      }
      await Promise.all(memberIDWithoutDuplicates(lastModifyMembers)
        .map(async (item) => {
          this.apiLastModifiedQueueService.addJob({
            apiName: ApiLastModifiedName.LINKED_COLLECTION_OBJECT_MEMBER,
            userId: item.memberId,
            email: item.email,
            updatedDate: item.updatedDate
          }, headers);
        }));
      const removeDuplicateUrlMembers = memberIDWithoutDuplicates(lastModifyUrlMembers);
      await Promise.all(removeDuplicateUrlMembers.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.URL_MEMBER,
          userId: item.memberId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      }));
    }
    return {
      itemPass: itemPass.map(({ id }) => ({ id })),
      itemFail
    };
  }

  async findByObjectUids(
    userId: number,
    objectUids: string[],
    objectType: string,
    options?: LinkedCollectionObjectServiceOptions) {
    return this.linkedCollectionObject.find({
      select: options?.fields,
      where: {
        object_uid: In(objectUids),
        object_type: objectType as LINK_OBJ_TYPE,
        user_id: userId
      }
    });
  }
  async findOneByObjectUidAndCollectionId(
    objectUid: Buffer, collectionId: number,
    options?: LinkedCollectionObjectServiceOptions) {
    return this.linkedCollectionObject.findOne({
      select: options?.fields,
      where: {
        object_uid: objectUid,
        collection_id: collectionId
      }
    });
  }

  private handleError(
    err: any,
    code: string,
    errors: LinkedCollectionParamError[],
    attributes: Partial<LinkedCollectionObjectDto>,
  ) {
    if (err instanceof LinkedCollectionParamError) {
      errors.push(err);
      return;
    } else {
      if (err instanceof QueryFailedError || err instanceof EntityNotFoundError) {
        errors.push(new LinkedCollectionParamError({
          code,
          message: err.message,
          attributes
        }));
        return;
      }
    }
    throw err;
  }
}