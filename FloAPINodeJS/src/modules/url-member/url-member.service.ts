import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { v4 as uuid } from 'uuid';
import {
  ApiLastModifiedName,
  DELETED_ITEM_TYPE, SHARE_STATUS
} from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_LINK, MSG_ERR_NOT_FOUND, MSG_ERR_WHEN_CREATE, MSG_ERR_WHEN_UPDATE
} from '../../common/constants/message.constant';
import { GetAllFilter4Collection } from '../../common/dtos/get-all-filter';
import { DeletedItem } from '../../common/entities/deleted-item.entity';
import { ShareMember } from '../../common/entities/share-member.entity';
import { Url } from '../../common/entities/urls.entity';
import { IReq } from '../../common/interfaces';
import { LoggerService } from '../../common/logger/logger.service';
import { UrlRepository } from '../../common/repositories/url.repository';
import {
  generateDeletedDateByLength,
  generateMinusOrderNum,
  generateOutOfOrderRangeFailItem,
  getMinTable,
  memberIDWithoutDuplicates,
  userIDWithoutDuplicates
} from '../../common/utils/common';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { ApiLastModifiedQueueService, LastModified, LastModifiedMember } from '../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { SORT_OBJECT } from '../sort-object/sort-object.constant';
import { UrlMemberCreateError, UrlMembersCreateDto } from './dtos/url-member.create.dto';
import { UrlMemberDeleteDto } from './dtos/url-member.delete.dto';
import { UrlMembersUpdateDto } from './dtos/url-member.update.dto';

@Injectable()
export class UrlMembersService {
  constructor(
    private readonly urlRepository: UrlRepository,

    @InjectRepository(ShareMember)
    private readonly shareMemberRepository: Repository<ShareMember>,

    @InjectRepository(DeletedItem)
    private readonly deletedItemRepository: Repository<DeletedItem>,
    private readonly logger: LoggerService,
    private readonly deletedItemService: DeletedItemService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,

  ) { }

  async getShareMembersByCollectionId(colId: number) {
    const data = await this.shareMemberRepository.find({
      select: [
        'user_id',
        'member_user_id',
        'shared_email',
        'account_id',
        'collection_id',
        'access',
        'shared_status'
      ],
      where: {
        collection_id: colId,
        shared_status: SHARE_STATUS.JOINED
      },
    });

    if (data.length === 0) {
      return [];
    }
    const userIds = [];
    data.forEach(item => {
      userIds.push(item.member_user_id);
    });

    return userIds;
  }

  async getShareMembersByCollectionIds(colIds: number[]) {
    const data = await this.shareMemberRepository.find({
      select: [
        'user_id',
        'member_user_id',
        'account_id',
        'collection_id',
        'access',
        'shared_status'
      ],
      where: {
        collection_id: In(colIds),
        shared_status: SHARE_STATUS.JOINED
      },
    });

    if (data.length === 0) {
      return [];
    }
    const userIds = [];
    data.forEach(item => {
      userIds.push(item.member_user_id);
    });

    return [...new Set(userIds)];
  }

  checkPermission(existedItems, data, errors) {
    const okParams = [];

    data.forEach(item => {
      const found = existedItems.find(mem => mem.collection_id === item.collection_id);
      if (found) {
        if (found.shared_status !== SHARE_STATUS.JOINED) {
          errors.push({
            attributes: { collection_id: item.collection_id },
            code: ErrorCode.COLLECTION_NOT_JOIN,
            message: MSG_ERR_LINK.COLLECTION_NOT_JOIN,
          });
        } else if (found.access === 2) {
          okParams.push({
            ownerEmail: found.owner_email,
            ownerId: found.user_id,
            ownerCollectionId: found.collection_id,
            ...item
          });
        } else {
          errors.push({
            attributes: { collection_id: item.collection_id },
            code: ErrorCode.COLLECTION_NOT_EDIT_PER,
            message: MSG_ERR_LINK.COLLECTION_NOT_EDIT_PER,
          });
        }
      } else {
        errors.push({
          attributes: { collection_id: item.collection_id },
          code: ErrorCode.COLLECTION_NOT_FOUND,
          message: MSG_ERR_LINK.COLLECTION_NOT_EXIST,
        });
      }
    });

    return okParams;
  }

  // Get list of url by memberId & url ids
  async CheckLinkedUrlsMemberPermission(
    linkedUrl,
    data,
    errors
  ) {
    const okParams = [];
    data.forEach(item => {
      const found = linkedUrl.find(mem => (
        mem.id === item.id &&
        mem.collection_id === item.collection_id
      ));
      if (found) {
        if (found.shared_status !== SHARE_STATUS.JOINED) {
          errors.push({
            attributes: {
              collection_id: item.collection_id,
            },
            code: ErrorCode.COLLECTION_NOT_JOIN,
            message: MSG_ERR_LINK.COLLECTION_NOT_JOIN,
          });
        } else if (found.access === 2) {
          const obj = {
            ownerEmail: found.owner_email,
            ownerId: found.user_id,
            ownerCollectionId: found.collection_id,
            ...found
          };
          if (obj.uid) {
            obj.uid = obj.uid.toString();
          }
          if (item.url) {
            obj.url = item.url;
          }
          if (item.title) {
            obj.title = item.title;
          }
          if (item.recent_date) {
            obj.recent_date = item.recent_date;
          }
          if (typeof item.is_trashed === 'number') {
            obj.is_trashed = item.is_trashed;
          }
          okParams.push(obj);
        } else {
          errors.push({
            attributes: {
              collection_id: item.collection_id,
            },
            code: ErrorCode.COLLECTION_NOT_EDIT_PER,
            message: MSG_ERR_LINK.COLLECTION_NOT_EDIT_PER,
          });
        }
      } else {
        errors.push({
          attributes: {
            collection_id: item.collection_id,
          },
          code: ErrorCode.OBJECT_NOT_FOUND,
          message: MSG_ERR_NOT_FOUND,
        });
      }
    });

    return okParams;
  }

  async getPermissions(userId: number, colIds: number[], sharedStatus?: number) {
    const aliasName = this.shareMemberRepository.metadata.name;
    const ownFields = ['user_id', 'member_user_id', 'account_id', 'collection_id', 'access', 'shared_status'];
    const query = this.shareMemberRepository.createQueryBuilder(aliasName)
      .select(`user.username`, 'owner_email')
      .innerJoin('user', 'user', `user.id = ${aliasName}.user_id`)
      .where(`${aliasName}.collection_id IN(:colIds)`, { colIds })
      .andWhere(`${aliasName}.member_user_id = :userId`, { userId });

    if (typeof sharedStatus === 'number') {
      query.andWhere(`${aliasName}.shared_status = :sharedStatus`, {
        sharedStatus
      });
    }
    ownFields.forEach(f => {
      query.addSelect(`${aliasName}.${String(f)}`, f);
    });
    return await query.getRawMany();
  }

  async getAll(filter: GetAllFilter4Collection<Url>, { user, headers }: IReq) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const data = await this.databaseUtilitiesService.getAllUrlMember({
      memberId: user.userId,
      filter,
      repository: this.urlRepository
    });

    let deletedItems = [];
    if (filter.has_del === 1) {
      deletedItems = await this.deletedItemService.findAll(
        user.userId, DELETED_ITEM_TYPE.URL_MEMBER, {
        ids,
        modified_gte,
        modified_lt,
        page_size
      });
      return {
        data,
        data_del: deletedItems
      };

    }
    return {
      data
    };
  }

  async saveBatch(
    data: UrlMembersCreateDto[],
    errs: any,
    { user, headers }: IReq
  ): Promise<{ results: any, errors: any }> {
    const results = [];
    const collections = data.map(item => item.collection_id);
    const existedItems = await this.getPermissions(
      user.userId,
      collections
    );

    const filteredData = this.checkPermission(existedItems, data, errs);
    const dates = generateDeletedDateByLength(filteredData.length);
    const lastModifyMembers: LastModifiedMember[] = [];
    const lastModifyOwners: LastModified[] = [];
    await Promise.all(filteredData.map(async (value, index) => {
      try {
        // fix bug FB-1640, url of owner
        const minNumber = await getMinTable(this.urlRepository, 'order_number', value.ownerId);
        const getMinByIndex: number = Number(generateMinusOrderNum(minNumber, index));
        if (getMinByIndex < SORT_OBJECT.MIN_ORDER_NUMBER) {
          errs.push(generateOutOfOrderRangeFailItem(value));
          return false; // This will skip current element
        }
        const updatedDate = dates[index];
        const urlEntity = this.urlRepository.create({
          user_id: value.ownerId,
          uid: uuid(),
          url: value.url,
          title: value.title,
          recent_date: value.recent_date ? value.recent_date : updatedDate,
          order_number: getMinByIndex,
          created_date: updatedDate,
          updated_date: updatedDate,
          order_update_time: updatedDate,
          is_trashed: value.is_trashed
        });

        const result = await this.urlRepository.save(urlEntity);
        lastModifyOwners.push({
          userId: value.ownerId,
          email: value.ownerEmail,
          updatedDate
        });
        const memberIds = await this.getShareMembersByCollectionId(value.ownerCollectionId);
        memberIds.forEach(memberId => {
          lastModifyMembers.push({
            memberId,
            email: value.ownerEmail,
            updatedDate
          });
        });
        result['ref'] = value.ref;
        results.push({
          ...result,
          owner: value.ownerEmail
        });
      } catch (err) {
        if (err instanceof UrlMemberCreateError) {
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

    // remove duplicate user member
    if (results.length > 0) {
      // push last modify for each member
      await Promise.all(memberIDWithoutDuplicates(lastModifyMembers)
        .map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.URL_MEMBER,
          userId: item.memberId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      }));
      await Promise.all(userIDWithoutDuplicates(lastModifyOwners)
        .map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.URL,
          userId: item.userId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      }));
    }

    return {
      results,
      errors: errs,
    };
  }

  async save(item: Url): Promise<Url> {
    return this.urlRepository.save(item);
  }

  async updateBatch(data: UrlMembersUpdateDto[], upErrors: any, { user, headers }: IReq)
    : Promise<{ results: any, errors: any }> {
    const results = [];

    const collectionIds = data.map(item => item.collection_id);
    const linkedUrlMembers = await this.databaseUtilitiesService.getUrlsMemberByCollectionIds(
      collectionIds,
      user.userId,
      data,
      this.urlRepository
    );

    const filteredData = await this.CheckLinkedUrlsMemberPermission(
      linkedUrlMembers,
      data,
      upErrors
    );

    const currentTime = getUtcMillisecond();
    const lastModifyMembers = [];
    const lastModifyOwners = [];
    await Promise.all(filteredData.map(async (uitem, idx) => {
      let result: any;
      try {
        const { ownerId, ownerEmail, ownerCollectionId } = Object.assign({}, uitem);
        uitem.updated_date = getUpdateTimeByIndex(currentTime, idx);
        const updatedDate = uitem.updated_date;
        result = await this.update(uitem, ownerId);
        if (!result || !result.id) {
          delete uitem.updated_date;
          delete uitem.order_update_time;
          upErrors.push({
            message: MSG_ERR_WHEN_UPDATE,
            code: ErrorCode.INVALID_DATA,
            attributes: uitem
          });
          this.logger.logError(result);
          return result;
        }
        result.owner = ownerEmail;
        lastModifyOwners.push({ memberId: ownerId, updatedDate });
        const memberIds = await this.getShareMembersByCollectionId(ownerCollectionId);
        memberIds.forEach(memberId => {
          lastModifyMembers.push({ memberId, updatedDate });
        });
        results.push(result);
      } catch (err) {
        upErrors.push({
          message: err.sqlMessage,
          code: ErrorCode.BAD_REQUEST,
          errno: err.errno,
          attributes: uitem
        });
        this.logger.logError(err);
      }
      return result;
    }));

    // remove duplicate user member
    const removeDuplicateOwnerIds = memberIDWithoutDuplicates(lastModifyOwners);
    const removeDuplicateMemberIds = memberIDWithoutDuplicates(lastModifyMembers);
    if (results.length > 0) {
      // push last modify for each member
      await Promise.all(removeDuplicateMemberIds.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.URL_MEMBER,
          userId: item.memberId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      }));
      await Promise.all(removeDuplicateOwnerIds.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.URL,
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

  async update(urlInfo: Url, userId: number): Promise<any> {
    const args = this.urlRepository.create(urlInfo);
    delete args.user_id;
    const upResult = await this.urlRepository.update({
      id: urlInfo.id,
      user_id: userId
    }, args);

    if (upResult && upResult.affected === 1) {
      return args;
    } else {
      return upResult;
    }
  }

  async deleteBatch(data: UrlMemberDeleteDto[], delErrs: any, { user, headers }: IReq)
    : Promise<{ results: any, errors: any }> {

    const _now = Date.now();
    const results = [];
    let memberLastModifies = [];
    let ownerLastModifies = [];
    let deletedItems: DeletedItem[] = [];

    const collectionIds = data.map(item => item.collection_id);
    const linkedUrlMembers = await this.databaseUtilitiesService.getUrlsMemberByCollectionIds(
      collectionIds,
      user.userId,
      data,
      this.urlRepository
    );

    const filteredData = await this.CheckLinkedUrlsMemberPermission(
      linkedUrlMembers,
      data,
      delErrs
    );

    await Promise.all(filteredData.map(async (uitem, index) => {
      let result: any;
      try {
        const updatedDate = (_now + index) / 1000;
        result = await this.delete(uitem, uitem.ownerId, uitem.ownerCollectionId, updatedDate);
        if (!result || !result.item) {
          delErrs.push({
            message: result.item,
            code: ErrorCode.OBJECT_NOT_EXIST,
            attributes: uitem
          });
          this.logger.logError(result);
          return result;
        } else {
          deletedItems = deletedItems.concat(result.deletedItems);
          ownerLastModifies = deletedItems.concat(result.ownerLastModifies);
          memberLastModifies = deletedItems.concat(result.memberLastModifies);
          results.push({ id: uitem.id });
        }
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

    if (results.length > 0) {
      await this.deletedItemService.createMultiple(deletedItems);
      const ownerWithoutDuplicates = userIDWithoutDuplicates(ownerLastModifies);
      ownerWithoutDuplicates.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.URL,
          userId: item.userId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      });
      /* Move logic to trash delete
      const memberWithoutDuplicates = this.removeDuplicateUser(memberLastModifies);
      memberWithoutDuplicates.map(async (item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.URL_MEMBER,
          userId: item.user_id,
          updatedDate: item.updatedDate
        });
      }); */
    }

    return {
      results,
      errors: delErrs
    };
  }

  async delete(
    item: Url,
    ownerId: number,
    collectionId: number,
    created_date: number
  ): Promise<{
    item: Url,
    deletedItems: DeletedItem[],
    ownerLastModifies: any[],
    memberLastModifies: any[],
  }> {
    // delete url object
    const delResult = await this.urlRepository.delete({
      id: item.id,
      user_id: ownerId
    });
    if (delResult.affected === 0) {
      return;
    }
    const memberLastModifies = [];
    const ownerLastModifies = [];
    const deletedItems: DeletedItem[] = [];
    deletedItems.push(this.deletedItemRepository.create({
      item_type: DELETED_ITEM_TYPE.URL,
      item_id: item.id,
      item_uid: item.uid,
      user_id: ownerId,
      created_date,
      updated_date: created_date,
    }));
    ownerLastModifies.push({ userId: ownerId, updatedDate: created_date });

    // create deleted item for member
    /* Move logic to trash delete
    const members = await this.getShareMembersByCollectionId(collectionId);
    if (members.length > 0) {
      members.forEach(memberId => {
        deletedItems.push(this.deletedItemRepository.create({
          item_type: DELETED_ITEM_TYPE.URL_MEMBER,
          item_id: item.id,
          item_uid: item.uid,
          user_id: memberId,
          created_date,
          updated_date: created_date,
        }));

        memberLastModifies.push({ user_id: memberId, updatedDate: created_date});
      });
    } */

    // // TODO: remove these lines if QA check ok
    // this.deleteObjectQueueService.addJob({
    //   userId: ownerId,
    //   objectUid: item.uid,
    //   objectType: OBJ_TYPE.URL,
    //   objectId: item.id,
    // });

    return {
      item,
      deletedItems,
      ownerLastModifies,
      memberLastModifies,
    };
  }

}