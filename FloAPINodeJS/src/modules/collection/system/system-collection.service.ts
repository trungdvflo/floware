import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApiLastModifiedName,
  DELETED_ITEM_TYPE,
  SYSTEM_COLLECTION_DEFAULT
} from '../../../common/constants';
import { ErrorCode } from '../../../common/constants/error-code';
import {
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_NOT_EXIST,
  MSG_ERR_WHEN_CREATE,
  MSG_ERR_WHEN_DELETE,
  MSG_ERR_WHEN_UPDATE
} from '../../../common/constants/message.constant';
import { BaseGetDTO } from '../../../common/dtos/base-get.dto';
import { SystemCollection } from '../../../common/entities/collection-system.entity';
import { IReq } from '../../../common/interfaces';
import { filterDuplicateItemsWithKey } from '../../../common/utils/common';
import { CryptoUtil } from '../../../common/utils/crypto.util';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../../common/utils/date.util';
import { buildFailItemResponse } from '../../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../../database/database-utilities.service';
import { DeletedItemService } from '../../deleted-item/deleted-item.service';
import { DeleteSystemCollectionDTO } from './dtos/system-collection.delete.dto';
import { CreateSystemCollectionDTO } from './dtos/system-collection.post.dto';
import { UpdateSystemCollectionDTO } from './dtos/system-collection.put.dto';
@Injectable()
export class SystemCollectionService {
  constructor(
    @InjectRepository(SystemCollection)
    private readonly systemCollection: Repository<SystemCollection>,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly deletedItem: DeletedItemService) { }

  async getAllFiles(filter: BaseGetDTO, user_id: number) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const collections: SystemCollection[] = await this.databaseUtilitiesService.getAll({
      userId: user_id,
      filter,
      repository: this.systemCollection
    });

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem
        .findAll(user_id, DELETED_ITEM_TYPE.SYSTEM_COLLECTION, {
          ids,
          modified_gte,
          modified_lt,
          page_size
        });
    }
    collections.map((item) => {
      delete item.checksum;
      return item;
    });

    return {
      data: collections,
      data_del: deletedItems
    };
  }

  async createSystemCollection(data: CreateSystemCollectionDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    // Filter duplicate name of payload
    const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['name']);
    if (dataError.length > 0) {
      dataError.map(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }

    if (dataPassed.length > 0) {
      await Promise.all(dataPassed.map(async (item: CreateSystemCollectionDTO, idx) => {
        try {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(dateItem);
          const colEntity = this.systemCollection.create({
            user_id: user.id,
            is_default: SYSTEM_COLLECTION_DEFAULT.NOT_DEFAULT,
            checksum: CryptoUtil.converToMd5(item.name + user.id),
            ...item,
            created_date: dateItem,
            updated_date: dateItem
          });
          const itemRespond = await this.systemCollection.save(colEntity);
          delete itemRespond['checksum'];

          if (item.ref) itemRespond['ref'] = item.ref;
          timeLastModify.push(dateItem);
          itemPass.push(itemRespond);
        } catch (error) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_CREATE, item);
          itemFail.push(errItem);
        }
      }));
    }

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.SYSTEM_COLLECTION,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }
    return { itemPass, itemFail };
  }

  async updateSystemCollection(data: UpdateSystemCollectionDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    // Filter duplicate name of payload
    const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['name']);
    if (dataError.length > 0) {
      dataError.map(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }

    if (dataPassed.length > 0) {
      await Promise.all(data.map(async (item: UpdateSystemCollectionDTO, idx) => {
        try {
          const itemSystem = await this.systemCollection.findOne({
            where: {
              id: item.id,
              user_id: user.id,
              type: item.type,
              is_default: SYSTEM_COLLECTION_DEFAULT.NOT_DEFAULT
            }
          });

          if (!itemSystem) {
            const errNotFound = buildFailItemResponse(ErrorCode.SYSTEM_NOT_FOUND,
              MSG_ERR_NOT_EXIST, item);
            itemFail.push(errNotFound);
          } else {
            const dateItem = getUpdateTimeByIndex(currentTime, idx);
            if (item.name) {
              item.checksum = CryptoUtil.converToMd5(item.name + user.id);
            }
            const result = await this.systemCollection.save({
              ...itemSystem, // existing fields
              ...item,// updated fields,
              updated_date: dateItem
            });
            delete result['checksum'];
            timeLastModify.push(dateItem);
            itemPass.push(result);
          }
        } catch (error) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_UPDATE, item);
          itemFail.push(errItem);
        }
      }));
    }

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.SYSTEM_COLLECTION,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }
    return { itemPass, itemFail };
  }

  async deleteSystemCollection(data: DeleteSystemCollectionDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    await Promise.all(data.map(async (item, idx) => {
      try {
        const itemSystem = await this.systemCollection.findOne({
          where: {
            id: item.id,
            is_default: SYSTEM_COLLECTION_DEFAULT.NOT_DEFAULT,
            user_id: user.id
          }
        });

        if (!itemSystem) {
          const errNotFound = buildFailItemResponse(ErrorCode.SYSTEM_NOT_FOUND,
            MSG_ERR_NOT_EXIST, item);
          itemFail.push(errNotFound);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          const isInsertDeletedItem = await this.deletedItem.create(user.id, {
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.SYSTEM_COLLECTION,
            is_recovery: 0,
            created_date: dateItem,
            updated_date: dateItem
          });
          if (!isInsertDeletedItem) { // push item into itemFail if false
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
            itemFail.push(errItem);
          } else { // remove item in system collection table
            const rs = await this.systemCollection.delete({
              id: itemSystem.id,
              user_id: user.id,
            });
            if (rs.affected === 1 && itemSystem.checksum !== null) {
              const rsData = await this.systemCollection.findOne({
                select: ['id'],
                where: {
                  user_id: user.id,
                  is_default: SYSTEM_COLLECTION_DEFAULT.NOT_DEFAULT,
                  name: itemSystem.name,
                  checksum: null
                }
              });
              if (rsData && rsData.id) {
                await this.systemCollection.update({ id: rsData.id }, {
                  checksum: itemSystem.checksum
                });
              }
            }
            timeLastModify.push(dateItem);
            itemPass.push({ id: itemSystem.id });
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
        apiName: ApiLastModifiedName.SYSTEM_COLLECTION,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return { itemPass, itemFail };
  }
}