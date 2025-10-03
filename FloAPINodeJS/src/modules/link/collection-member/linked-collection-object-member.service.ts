import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, In, QueryFailedError, Repository } from 'typeorm';
import {
  ApiLastModifiedName,
  COLLECTION_ALLOW_TYPE,
  DELETED_ITEM_TYPE,
  IS_TRASHED,
  MEMBER_ACCESS,
  OBJ_TYPE,
  SHARE_STATUS
} from '../../../common/constants/common';
import { ErrorCode } from '../../../common/constants/error-code';
import { MSG_ERR_LINK } from '../../../common/constants/message.constant';
import { GetAllFilter, GetAllFilter4Collection } from '../../../common/dtos/get-all-filter';
import { LINK_OBJ_TYPE } from '../../../common/dtos/object-uid';
import {
  Collection, DeletedItem, KanbanCard,
  LinkedCollectionObject, ShareMember, Url
} from '../../../common/entities';
import { IUser } from '../../../common/interfaces';
import { IDeleteItem } from '../../../common/interfaces/delete-item.interface';
import { LoggerService } from '../../../common/logger/logger.service';
import { CollectionActivityRepository } from '../../../common/repositories';
import { memberIDWithoutDuplicates, pickObject, replaceHref, userIDWithoutDuplicates } from '../../../common/utils/common';
import { getUtcMillisecond } from '../../../common/utils/date.util';
import { buildFailItemResponse } from '../../../common/utils/respond';
import { filterGetAllFields } from "../../../common/utils/typeorm.util";
import { ApiLastModifiedQueueService, LastModified, LastModifiedMember } from '../../bullmq-queue/api-last-modified-queue.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { GlobalSettingService as SettingService } from '../../setting/setting.service';
import { ShareMemberService } from '../../share-member/share-member.service';
import { LinkHelper } from '../helper/link.helper';
import { LinkedCollectionWithRef } from './dtos/create-linked-collection-member.response';
import { DeleteLinkedCollectionObjectMemberDto } from './dtos/delete-linked-collection-object-member.dto';
import {
  LinkedCollectionParamError
} from './dtos/error.dto';
import { LinkedCollectionObjectMemberDto } from './dtos/linked-collection-object-member.dto';

export interface LinkedCollectionObjectServiceOptions {
  fields: (keyof LinkedCollectionObject)[];
}

@Injectable()
export class LinkedCollectionObjectMemberService {
  constructor(
    @InjectRepository(KanbanCard)
    private readonly kanbanCardRepo: Repository<KanbanCard>,
    @InjectRepository(LinkedCollectionObject)
    private readonly linkedCollectionObject: Repository<LinkedCollectionObject>,
    private readonly deletedItemService: DeletedItemService,
    private readonly shareMemberService: ShareMemberService,
    private readonly logger: LoggerService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly settingService: SettingService,
    private readonly collectionActivityRepo: CollectionActivityRepository,
  ) { }

  private async getAll(userId: number, filter?: GetAllFilter4Collection<LinkedCollectionObject>) {
    const { modified_gte, modified_lt, min_id, page_size, ids, remove_deleted, collection_id }
      = filter;
    let linkFields = [
      'link.id AS id',
      'link.collection_id AS collection_id',
      'link.object_uid AS object_uid',
      'link.object_type AS object_type',
      'link.account_id AS account_id',
      'link.object_href AS object_href',
      'link.is_trashed AS is_trashed',
      'link.email_time AS email_time',
      'link.created_date AS created_date',
      'link.updated_date AS updated_date',
    ];
    const fields = filterGetAllFields(this.linkedCollectionObject, filter.fields);
    if (fields && fields.length > 0) {
      linkFields = fields.map(f => `link.${String(f)} AS ${String(f)}`);
    }
    let query = this.linkedCollectionObject
      .createQueryBuilder('link')
      .select(linkFields)
      .addSelect('member.calendar_uri', 'member_calendar_uri')
      .addSelect('col.calendar_uri', 'owner_calendar_uri')
      .addSelect('owner.username', 'owner_username')
      .innerJoin("collection_shared_member", "member", `link.collection_id = member.collection_id
        AND member.shared_status = :sharedStatus`, { sharedStatus: SHARE_STATUS.JOINED })
      .innerJoin("collection", "col", `link.collection_id = col.id`)
      .innerJoin("user", "owner", `link.user_id = owner.id`)
      .where(`member.member_user_id = :userId`, { userId });

    if (modified_lt || modified_lt === 0) {
      query = query.andWhere(`link.updated_date < :modified_lt`, { modified_lt });
      query = query.addOrderBy(`link.updated_date`, "DESC");
    }
    if (modified_gte || modified_gte === 0) {
      query = query.andWhere(`link.updated_date >= :modified_gte`, { modified_gte });
      query = query.addOrderBy(`link.updated_date`, "ASC");
    }
    if (min_id || min_id === 0) {
      query = query.andWhere(`link.id > :min_id`, { min_id });
      query = query.addOrderBy(`link.id`, "ASC");
    }
    if (ids) {
      query = query.andWhere(`link.id IN (:...ids)`, { ids });
    }
    if (collection_id) {
      query = query.andWhere(`link.collection_id = :collection_id`, { collection_id });
    }

    if (remove_deleted) {
      query = query.andWhere(
        `link.is_trashed != :is_trashed`, { is_trashed: IS_TRASHED.DELETED });
    }

    return await query.limit(page_size).getRawMany();
  }

  private getPermissionAndCalUri(user_id: number, col_ids: number[]) {
    return this.shareMemberService.getShareMembersWithCollectionInfo(user_id, col_ids);
  }

  private async updateLastModify(
    owner: { user_id, email }, members: ShareMember[]
    , updatedDate: number, headers) {
    await this.apiLastModifiedQueueService.addJob({
      apiName: ApiLastModifiedName.LINKED_COLLECTION_OBJECT,
      userId: owner.user_id,
      email: owner.email,
      updatedDate
    }, headers);
    await members.forEach(member => {

      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.LINKED_COLLECTION_OBJECT_MEMBER,
        userId: member.member_user_id,
        email: member.shared_email,
        updatedDate
      }, headers);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.URL_MEMBER,
        userId: member.member_user_id,
        email: member.shared_email,
        updatedDate
      }, headers);
    });
  }

  private checkPermission(perItems: ShareMember[], linkParams, errors) {
    const okParams = [];
    linkParams.forEach(item => {
      const found = perItems.find(mem =>
        mem.collection_id === item.collection_id);

      if (found) {
        if (found.shared_status !== SHARE_STATUS.JOINED) {
          errors.push(new LinkedCollectionParamError({
            attributes: {
              id: item.id,
              collection_id: item.collection_id
            },
            code: ErrorCode.COLLECTION_NOT_JOIN,
            message: MSG_ERR_LINK.COLLECTION_NOT_JOIN,
          }));
        } else if (found.access === MEMBER_ACCESS.READ_WRITE) {
          okParams.push({
            ownerId: found.user_id,
            member_calendar_uri: found.calendar_uri,
            owner_calendar_uri: found['owner_calendar_uri'],
            owner_username: found['owner_username'],
            email: found.email,
            linkParam: item
          });
        } else {
          errors.push(new LinkedCollectionParamError({
            attributes: {
              id: item.id,
              collection_id: item.collection_id
            },
            code: ErrorCode.COLLECTION_NOT_EDIT_PER,
            message: MSG_ERR_LINK.COLLECTION_NOT_EDIT_PER,
          }));
        }
      } else {
        errors.push(new LinkedCollectionParamError({
          attributes: {
            id: item.id,
            collection_id: item.collection_id
          },
          code: ErrorCode.COLLECTION_NOT_FOUND,
          message: MSG_ERR_LINK.COLLECTION_NOT_EXIST,
        }));
      }
    });

    return okParams;
  }

  async findOne(user_id: number, id: number) {
    try {
      return this.linkedCollectionObject.findOne({ where: { user_id, id } });
    } catch (err) {
      throw err;
    }
  }
  // this method retrieves all entries
  async findAll(user: IUser, filter?: GetAllFilter<LinkedCollectionObject>) {
    const fields = filter.fields;
    delete filter.fields;
    const _links = await this.getAll(user.userId, filter);
    const links = _links.map((item) => {
      const object_type = item.object_type?.toString() as LINK_OBJ_TYPE;
      return {
        id: item.id,
        collection_id: item.collection_id,
        object_uid: LinkHelper.getObjectUid(item.object_uid, object_type),
        object_type,
        account_id: item.account_id,
        object_href: replaceHref(item.object_href
          , item.owner_calendar_uri, item.member_calendar_uri, item.owner_username, user.email),
        is_trashed: item.is_trashed,
        created_date: item.created_date,
        updated_date: item.updated_date,
        email_time: item.email_time
      };
    });
    // deleted items
    const { modified_gte, modified_lt, ids, page_size } = filter;
    let deletedItems: DeletedItem[] = [];
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItemService
        .findAll(user.userId, DELETED_ITEM_TYPE.COLLECTION_LINK_MEMBER, {
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

  create(userId: number, newCollectionLink: LinkedCollectionObjectMemberDto, createdDate: number):
    Promise<LinkedCollectionObject> {
    const obj = {
      user_id: userId,
      collection_id: newCollectionLink.collection_id,
      object_uid: newCollectionLink.object_uid.objectUid,
      object_type: newCollectionLink.object_type,
      account_id: newCollectionLink.account_id,
      object_href: newCollectionLink.object_href,
      email_time: newCollectionLink.email_time || 0,
      created_date: createdDate,
      updated_date: createdDate,
      is_trashed: newCollectionLink.is_trashed
    };
    const colEntity = this.linkedCollectionObject.create(obj);

    return this.linkedCollectionObject.save(colEntity);
  }
  async createBatchLinks(
    linkParams: LinkedCollectionObjectMemberDto[],
    { user, headers }
  ): Promise<{
    created: LinkedCollectionWithRef[];
    errors: LinkedCollectionParamError[];
  }> {
    const errors: LinkedCollectionParamError[] = [];
    let createdLinks: LinkedCollectionWithRef[] = [];
    if (linkParams.length > 0) {
      const existedItems = await this
        .getPermissionAndCalUri(user.userId, linkParams.map(l => l.collection_id));
      const okParams = this.checkPermission(existedItems, linkParams, errors);
      const now = getUtcMillisecond();
      createdLinks = await Promise.all(
        okParams.map(async (okParam, index) => {
          const linkParam: LinkedCollectionObjectMemberDto = okParam.linkParam;
          try {
            linkParam.account_id = 0;
            const member_object_href = linkParam.object_href;
            linkParam.object_href = replaceHref(member_object_href
              , okParam.member_calendar_uri, okParam.owner_calendar_uri
              , user.email, okParam.owner_username);
            const createdDate = (now + index) / 1000;
            const newLink = await this.create(okParam.ownerId, linkParam, createdDate);
            const members = await this.shareMemberService
              .getShareMembers(newLink.collection_id, null);

            this.updateLastModify({
              user_id: okParam.ownerId,
              email: okParam.email
            }, members, createdDate, headers);
            return new LinkedCollectionWithRef({
              id: newLink.id,
              collection_id: newLink.collection_id,
              object_uid: LinkHelper.getObjectUid(newLink.object_uid, newLink.object_type),
              object_type: newLink.object_type,
              account_id: newLink.account_id,
              object_href: member_object_href,
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
    }
    const successLinks = createdLinks.filter(Boolean);

    return {
      created: successLinks,
      errors,
    };
  }

  async deleteBatchLinks(linkParams: DeleteLinkedCollectionObjectMemberDto[], { user, headers }) {
    const kanbanCardIds = [];
    const itemPass = [];
    const itemFail = [];
    const insertDeletedItemLinks: IDeleteItem[] = [];
    const insertDeletedItemKanbanCards: IDeleteItem[] = [];
    const ownerLinkLastModifies: LastModified[] = [];
    const memberLinkLastModifies: LastModifiedMember[] = [];
    const ownerKanbanCardLastModifies: LastModified[] = [];
    const memberKanbanCardLastModifies: LastModifiedMember[] = [];
    const links = await this.linkedCollectionObject
      .findBy({ id: In(linkParams.map(l => l.id)) });
    const linkParamsFull = linkParams.map(l => {
      const link = links.find(item => item.id === l.id);
      const collection_id = link ? link.collection_id : null;
      return {
        ...l,
        collection_id
      };
    });
    const perItems = await this.shareMemberService
      .getShareMembers(links.map(l => l.collection_id), user.userId);
    const okParams = this.checkPermission(perItems, linkParamsFull, itemFail);
    const now = getUtcMillisecond();
    await Promise.all(okParams.map(async (okParam, index) => {
      const linkParam = okParam.linkParam;
      const ownerId = okParam.ownerId;
      try {
        const errLik = MSG_ERR_LINK.LINK_NOT_EXIST;
        const lsKanban = await this.linkedCollectionObject.createQueryBuilder('lco')
          .select(['lco.id as lcoID', 'lco.collection_id collectionId',
            'lco.object_uid as objectUid', 'lco.object_type as objectType', 'u.id as objectId'])
          .addSelect('co.type', 'collectionType')
          .addSelect(`kc.id`, 'kanbanCardId')
          .addSelect(`kc.user_id`, 'kbUserId')
          .addSelect(`uu.email`, 'email')
          .innerJoin(Collection, 'co', 'co.id = lco.collection_id')
          .leftJoin(Url, 'u', 'u.uid = lco.object_uid')
          .leftJoin(KanbanCard, 'kc'
            , 'kc.object_uid = lco.object_uid AND kc.object_type = lco.object_type')
          .leftJoin('user', 'uu', 'uu.id = kc.user_id')
          .where(`lco.id = :id`, { id: linkParam.id })
          .andWhere(`lco.user_id = :userId`, { userId: ownerId }).execute();

        if (lsKanban.length === 0) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
            errLik, linkParam);
          return itemFail.push(errItem);
        }
        const { objectId, objectUid, objectType, collectionId, collectionType } = lsKanban[0];
        // remove item
        const deleteItemlco = await this.linkedCollectionObject
          .delete({ id: linkParam.id, user_id: ownerId });

        if (!deleteItemlco || deleteItemlco.affected === 0) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, errLik, linkParam);
          itemFail.push(errItem);
        } else {
          const members = await this.shareMemberService
            .getShareMembers(linkParam.collection_id, null);
          const deletedDate = (now + index) / 1000;
          insertDeletedItemLinks.push({
            user_id: ownerId,
            item_id: linkParam.id,
            item_type: DELETED_ITEM_TYPE.COLLECTION_LINK,
            created_date: deletedDate,
            updated_date: deletedDate
          });
          ownerLinkLastModifies.push({
            userId: ownerId,
            email: okParam.email,
            updatedDate: deletedDate
          });

          for (const member of members) {
            insertDeletedItemLinks.push({
              user_id: member.member_user_id,
              item_id: linkParam.id,
              item_type: DELETED_ITEM_TYPE.COLLECTION_LINK_MEMBER,
              created_date: deletedDate,
              updated_date: deletedDate
            });
            // Deleted item URL member
            insertDeletedItemLinks.push({
              user_id: member.member_user_id,
              item_id: objectId,
              item_uid: objectUid,
              item_type: DELETED_ITEM_TYPE.URL_MEMBER,
              created_date: deletedDate,
              updated_date: deletedDate
            });
            memberLinkLastModifies.push({
              memberId: member.member_user_id,
              email: member.shared_email,
              updatedDate: deletedDate
            });
          }
          // remove item kanban card
          lsKanban.forEach(kbCard => {
            const kanbanCardId = kbCard.kanbanCardId;
            if (kanbanCardId > 0) {
              insertDeletedItemKanbanCards.push({
                user_id: kbCard.kbUserId,
                item_id: kanbanCardId,
                item_type: DELETED_ITEM_TYPE.CANVAS,
                created_date: deletedDate,
                updated_date: deletedDate
              });
              kanbanCardIds.push(kanbanCardId);
              (kbCard.kbUserId === ownerId
                ? ownerKanbanCardLastModifies.push({
                  userId: kbCard.kbUserId,
                  email: kbCard.email,
                  updatedDate: deletedDate
                })
                : memberKanbanCardLastModifies.push({
                  memberId: kbCard.kbUserId,
                  email: kbCard.email,
                  updatedDate: deletedDate
                })
              );
            }
          });
          if (collectionType === COLLECTION_ALLOW_TYPE.SharedCollection) {
            // update all activity follow collection_id after delete link
            const setting = await this.settingService.findOneByUserId(ownerId,
              { fields: ['omni_cal_id'] });
            const updateActivity = {
              collection_id: 0
            };
            if (objectType !== OBJ_TYPE.URL) {
              updateActivity['object_href'] = `/calendarserver.php/calendars/${user.email}/${setting.omni_cal_id}/${objectUid}.ics`;
            }
            await this.collectionActivityRepo.update({
              user_id: ownerId,
              collection_id: collectionId,
              object_uid: objectUid,
            }, updateActivity);
          }
          itemPass.push({ id: linkParam.id });
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, linkParam);
        this.logger.logError(error);
        itemFail.push(errItem);
      }
    }));

    if (itemPass.length > 0) {
      await this.deletedItemService.createMultiple(insertDeletedItemLinks);
      const ownerLinkWithoutDuplicates = userIDWithoutDuplicates(ownerLinkLastModifies);
      ownerLinkWithoutDuplicates.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.LINKED_COLLECTION_OBJECT,
          userId: item.userId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      });
      const memberLinkWithoutDuplicates = memberIDWithoutDuplicates(memberLinkLastModifies);
      memberLinkWithoutDuplicates.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.LINKED_COLLECTION_OBJECT_MEMBER,
          userId: item.memberId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.URL_MEMBER,
          userId: item.memberId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      });
      if (kanbanCardIds.length > 0) {
        await this.kanbanCardRepo.delete({ id: In(kanbanCardIds) });
        await this.deletedItemService.createMultiple(insertDeletedItemKanbanCards);
        const ownerKCardWithoutDuplicates = userIDWithoutDuplicates(ownerKanbanCardLastModifies);
        ownerKCardWithoutDuplicates.map(async (item) => {
          this.apiLastModifiedQueueService.addJob({
            apiName: ApiLastModifiedName.KANBAN_CARD,
            userId: item.userId,
            email: item.email,
            updatedDate: item.updatedDate
          }, headers);
        });

        // FB-2232 - FB-2233
        const memberKCardWithoutDuplicates = memberIDWithoutDuplicates(
          memberKanbanCardLastModifies);
        memberKCardWithoutDuplicates.map(async (item) => {
          this.apiLastModifiedQueueService.addJob({
            apiName: ApiLastModifiedName.KANBAN_CARD_MEMBER,
            userId: item.memberId,
            email: item.email,
            updatedDate: item.updatedDate
          }, headers);
        });
      }
    }

    return { itemPass, itemFail };
  }

  private handleError(
    err: any,
    code: string,
    errors: LinkedCollectionParamError[],
    attributes: Partial<LinkedCollectionObjectMemberDto>,
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