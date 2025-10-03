import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import {
  ApiLastModifiedName, OBJ_TYPE
} from '../../common/constants';
import { DELETED_ITEM_TYPE } from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_WHEN_CREATE,
  MSG_ERR_WHEN_DELETE,
  MSG_FIND_NOT_FOUND,
  SortObjectResponseMessage
} from '../../common/constants/message.constant';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { Cloud } from '../../common/entities/cloud.entity';
import { IReq } from '../../common/interfaces';
import {
  generateMinusOrderNum,
  generateOutOfOrderRangeFailItem, getMinTable, mergeByOrderNumber, randomStringGenerator
} from '../../common/utils/common';
import { generateDeletedDateByLength, getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { DeleteObjectQueueService } from '../bullmq-queue/delete-object-queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { SORT_OBJECT } from '../sort-object/sort-object.constant';
import { SortObjectService } from '../sort-object/sort-object.service';
import { CreateCloudDTO } from './dtos/create-cloud.dto';
import { DeleteCloudDTO } from './dtos/delete-cloud.dto';
import { UpdateCloudDTO } from './dtos/update-cloud.dto';

@Injectable()
export class CloudService {
  constructor(
    @InjectRepository(Cloud) private readonly cloudRepo: Repository<Cloud>,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly deletedItem: DeletedItemService,
    private readonly deleteObjectQueueService: DeleteObjectQueueService,
    private readonly sortObjectService: SortObjectService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService) { }

  async getAllFiles(filter: BaseGetDTO, { user, headers }: IReq) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const collections: Cloud[] = await this.databaseUtilitiesService.getAll({
      userId: user.id,
      filter,
      repository: this.cloudRepo
    });

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(user.id, DELETED_ITEM_TYPE.CSFILE, {
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

  async createCloud(data: CreateCloudDTO[], { user, headers }: IReq) {
    const itemFail = [];
    const entityItems = [];

    const isRunning = await this.sortObjectService.
      isResetOrderRunning(user.id, OBJ_TYPE.CSFILE.toString());
    if (isRunning) {
      return {
        itemFail: data.map((i) => {
          return buildFailItemResponse(ErrorCode.BAD_REQUEST,
            SortObjectResponseMessage.RESET_ORDER_IS_IN_PROGRESS, i);
        }),
      };
    }

    // get smallest value of Cloud
    const minNumber = await getMinTable(this.cloudRepo, 'order_number', user.id);
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    await Promise.all(data.map(async (value, idx) => {
      try {
        const uid = randomStringGenerator();
        const getMinByIndex: number = Number(generateMinusOrderNum(minNumber, idx));
        if (getMinByIndex < SORT_OBJECT.MIN_ORDER_NUMBER) {
          return itemFail.push(generateOutOfOrderRangeFailItem(value));
        }
        const dateItem = getUpdateTimeByIndex(currentTime, idx);
        timeLastModify.push(dateItem);
        value['user_id'] = user.id;
        value['uid'] = uid;
        value['order_number'] = getMinByIndex;
        value['order_update_time'] = dateItem;
        value['created_date'] = dateItem;
        value['updated_date'] = dateItem;
        if (value.ref) value['ref'] = value.ref;
        entityItems.push(value);
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_CREATE, value);
        if (error instanceof QueryFailedError &&
          error.message.indexOf(ErrorCode.ORDER_NUMBER_OUT_OF_RANGE) !== -1) {
          itemFail.push(generateOutOfOrderRangeFailItem(errItem));
        } else {
          itemFail.push(errItem);
        }
      }
    }));
    if (entityItems.length > 0) {
      const insertData = await this.cloudRepo.insert(entityItems);
      const itemPass = mergeByOrderNumber(insertData.generatedMaps as [], entityItems);
      if (timeLastModify.length > 0) {
        const updatedDate = Math.max(...timeLastModify);
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.CLOUD,
          userId: user.id,
          email: user.email,
          updatedDate
        }, headers);
      }
      return { itemPass, itemFail };
    }
    return { itemPass: [], itemFail };
  }

  async updateCloud(data: UpdateCloudDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];

    await Promise.all(data.map(async (item, idx) => {
      try {
        const itemCloud = await this.findItem({ where: { id: item.id, user_id: user.id } });
        if (!itemCloud) {
          const errNotFound = buildFailItemResponse(ErrorCode.CLOUD_NOT_FOUND,
            MSG_FIND_NOT_FOUND, item);
          itemFail.push(errNotFound);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(dateItem);
          const cloudItem = this.cloudRepo.create({
            ...itemCloud, // existing fields
            ...item,// updated fields,
            updated_date: dateItem
          });

          await this.cloudRepo.update({ id: item.id, user_id: user.id }, cloudItem);
          itemPass.push(cloudItem);
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        itemFail.push(errItem);
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.CLOUD,
        userId: user.id,
        email: user.email,

        updatedDate
      }, headers);
    }

    return { itemPass, itemFail };
  }

  async deleteCloud(data: DeleteCloudDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const uids: string[] = [];

    const deletedDates: number[] = generateDeletedDateByLength(data.length);
    await Promise.all(data.map(async (item, index) => {
      try {
        const itemCloud = await this.findItem({ where: { id: item.id, user_id: user.id } });

        if (!itemCloud) {
          const errItem = buildFailItemResponse(ErrorCode.CLOUD_NOT_FOUND,
            MSG_FIND_NOT_FOUND, item);
          itemFail.push(errItem);
        } else {
          const isInsertDeletedItem = await this.deletedItem.create(user.id, {
            item_id: item.id,
            item_type: DELETED_ITEM_TYPE.CSFILE,
            is_recovery: 0,
            created_date: deletedDates[index],
            updated_date: deletedDates[index]
          });
          if (!isInsertDeletedItem) { // push item into itemFail if false
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
            itemFail.push(errItem);
          } else { // remove item in cloud table
            await this.cloudRepo.delete({ id: itemCloud.id, user_id: user.id });
            itemPass.push({ id: itemCloud.id });
            uids.push(itemCloud.uid);
          }
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        itemFail.push(errItem);
      }
    }));

    if (itemPass.length > 0) {
      const updatedDate = Math.max(...deletedDates);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.CLOUD,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return { itemPass, itemFail };
  }

  public findItem(reqParam) {
    return this.cloudRepo.findOne(reqParam);
  }

  getById(id: number, user_id: number): Promise<Cloud> {
    return this.cloudRepo.findOne({
      where: { id, user_id }
    });
  }
}
