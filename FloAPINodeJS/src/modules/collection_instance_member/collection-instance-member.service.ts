import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApiLastModifiedName, DELETED_ITEM_TYPE, SHARE_STATUS } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_EXISTED,
  MSG_ERR_LINK,
  MSG_ERR_NOT_EXIST,
  MSG_ERR_WHEN_CREATE,
  MSG_ERR_WHEN_DELETE
} from '../../common/constants/message.constant';
import { GetAllFilter4Collection } from '../../common/dtos/get-all-filter';
import { CollectionInstanceMember } from '../../common/entities/collection-instance-member.entity';
import { ShareMember } from '../../common/entities/share-member.entity';
import { IReq } from '../../common/interfaces';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { DeleteCollectionInstanceMemberDTO } from './dtos/collection-instance-member.delete.dto';
import { CreateCollectionInstanceMemberDTO } from './dtos/collection-instance-member.post.dto';
import { UpdateCollectionInstanceMemberDTO } from './dtos/collection-instance-member.put.dto';

@Injectable()
export class CollectionInstanceMemberService {
  constructor(
    @InjectRepository(CollectionInstanceMember)
    private readonly instanceMember: Repository<CollectionInstanceMember>,
    @InjectRepository(ShareMember)
    private readonly shareMemberRepo: Repository<ShareMember>,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly deletedItem: DeletedItemService) { }

  async getAllFiles(filter: GetAllFilter4Collection<CollectionInstanceMember>,
    { user, headers }: IReq) {
    const { modified_gte, modified_lt, ids, page_size, collection_id } = filter;
    const collections: CollectionInstanceMember[]
      = await this.databaseUtilitiesService.getAll({
        userId: user.id,
        filter,
        repository: this.instanceMember
      }, collection_id);

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(user.id,
        DELETED_ITEM_TYPE.COLLECTION_INSTANCE_MEMBER,
        {
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

  public filterDuplicateItem(data: CreateCollectionInstanceMemberDTO[]) {
    const dataError = [];
    const dataFilter = data.filter((value, index, self) => {
      if (
        index ===
        self.findIndex(
          (t) =>
            t.collection_id === value.collection_id
        )
      ) {
        return value;
      }
      dataError.push(value);
    });
    return { dataFilter, dataError };
  }

  async createInstanceMember(data: CreateCollectionInstanceMemberDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const filterData = this.filterDuplicateItem(data);

    if (filterData && filterData.dataError.length > 0) {
      filterData.dataError.map(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    if (filterData && filterData.dataFilter.length > 0) {
      const lastData = filterData.dataFilter;
      const currentTime = getUtcMillisecond();
      const timeLastModify = [];

      await Promise.all(lastData.map(async (item: CreateCollectionInstanceMemberDTO, idx) => {
        const { collection_id } = item;
        try {
          const rsCollection = await this.shareMemberRepo.find({
            select: ["id"],
            where: {
              collection_id,
              member_user_id: user.id,
              shared_status: SHARE_STATUS.JOINED
            }
          });

          if (rsCollection.length <= 0) {
            const errItem = buildFailItemResponse(ErrorCode.COLLECTION_NOT_FOUND,
              MSG_ERR_LINK.COLLECTION_NOT_EXIST, item);
            return itemFail.push(errItem);
          }
          // check collection_id and share_email exist?
          const shareMemberExisted = await this.instanceMember.findOne({
            where: {
              user_id: user.id,
              collection_id
            }
          });
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          if (shareMemberExisted && shareMemberExisted.id) {
            const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
              MSG_ERR_EXISTED, item);
            return itemFail.push(errItem);
          }
          const colEntity = this.instanceMember.create({
            user_id: user.id,
            ...item,
            created_date: dateItem,
            updated_date: dateItem
          });
          const result = await this.instanceMember.insert(colEntity);
          timeLastModify.push(dateItem);
          itemPass.push({
            id: result.raw.insertId,
            ...colEntity,
            ref: item.ref
          });
        } catch (error) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_CREATE, item);
          itemFail.push(errItem);
        }
      }));

      if (timeLastModify.length > 0) {
        const updatedDate = Math.max(...timeLastModify);
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.COLLECTION_INSTANCE_MEMBER,
          userId: user.id,
          email: user.email,
          updatedDate
        }, headers);
      }
    }
    return { itemPass, itemFail };
  }

  async updateInstanceMember(data: UpdateCollectionInstanceMemberDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];

    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    await Promise.all(data.map(async (item: UpdateCollectionInstanceMemberDTO, idx) => {
      try {
        const itemMember = await this.instanceMember.findOne({
          where: { id: item.id, user_id: user.id }
        });
        if (!itemMember) {
          const errNotFound = buildFailItemResponse(ErrorCode.MEMBER_NOT_FOUND,
            MSG_ERR_NOT_EXIST, item);
          itemFail.push(errNotFound);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(dateItem);

          await this.instanceMember.update(
            { id: item.id }, { ...item, updated_date: dateItem });
          itemPass.push({ ...itemMember, ...item, updated_date: dateItem });
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        itemFail.push(errItem);
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.COLLECTION_INSTANCE_MEMBER,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }
    return { itemPass, itemFail };
  }

  async deleteInstanceBatch(data: DeleteCollectionInstanceMemberDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    await Promise.all(data.map(async (item, idx) => {
      try {
        const itemDB = await this.instanceMember.findOne({
          where: {
            id: item.id, user_id: user.id
          }
        });
        if (!itemDB) {
          const errNotFound = buildFailItemResponse(ErrorCode.MEMBER_NOT_FOUND,
            MSG_ERR_NOT_EXIST, item);
          itemFail.push(errNotFound);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          const isInsertDeletedItem = await this.deletedItem.create(user.id, {
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.COLLECTION_INSTANCE_MEMBER,
            is_recovery: 0,
            created_date: dateItem,
            updated_date: dateItem
          });
          if (!isInsertDeletedItem) { // push item into itemFail if false
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
            itemFail.push(errItem);
          } else { // remove item in cloud table
            await this.instanceMember.delete({ id: itemDB.id, user_id: user.id });
            timeLastModify.push(dateItem);
            itemPass.push({ id: itemDB.id });
          }
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        itemFail.push(errItem);
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.COLLECTION_INSTANCE_MEMBER,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return { itemPass, itemFail };
  }

  async deleteByColIdsAndUserId(colIds: number[], { user, headers }: IReq) {
    if (colIds.length === 0) return;
    const colInstances = await this.instanceMember.find({
      where: {
        collection_id: In(colIds),
        user_id: user.id
      }
    });
    if (colInstances.length === 0) return;
    const data = colInstances.map(item => {
      const dto = new DeleteCollectionInstanceMemberDTO();
      dto.id = item.id;
      return dto;
    });
    return this.deleteInstanceBatch(data, { user, headers });
  }
}