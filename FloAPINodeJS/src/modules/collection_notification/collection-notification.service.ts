import { Injectable } from '@nestjs/common';
import { ApiLastModifiedName, DELETED_ITEM_TYPE } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_DUPLICATE_ENTRY
} from '../../common/constants/message.constant';
import { CollectionNotificationEntity } from '../../common/entities/collection-notification.entity';
import { IReq } from '../../common/interfaces';
import { CollectionNotificationRepository } from '../../common/repositories/collection-notification.repository';
import { LastModify, filterDuplicateItemsWithKey, generateLastModifyItem } from '../../common/utils/common';
import {
  getUpdateTimeByIndex,
  getUtcMillisecond
} from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { DeleteNotificationDto, GetAllFilterCollectionNotification } from './dtos';
import { UpdateNotificationDto } from './dtos/notification.update.dto';

@Injectable()
export class CollectionNotificationService {
  constructor(
    private readonly notificationRepo: CollectionNotificationRepository,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly deletedItem: DeletedItemService) { }

  async getNotifications(filter:
    GetAllFilterCollectionNotification<CollectionNotificationEntity>, { user, headers }: IReq) {
    const { modified_gte, modified_lt, ids, page_size } = filter;

    const notifications: CollectionNotificationEntity[] = await this.notificationRepo
      .getNotifications({
        user,
        filter
      });

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(user.userId,
        DELETED_ITEM_TYPE.COLLECTION_NOTIFICATION,
        {
          ids,
          modified_gte,
          modified_lt,
          page_size
        });
    }

    return {
      data: notifications,
      data_del: deletedItems
    };
  }

  async updateNotificationStatus(noti: UpdateNotificationDto[], { user, headers }: IReq) {
    let itemPass = [];
    const itemFail = [];
    try {
      const currentTime: number = getUtcMillisecond();
      let itemLastModify: LastModify[] = [];
      const { dataPassed, dataError } = filterDuplicateItemsWithKey(noti, ['id']);
      if (dataError.length > 0) {
        dataError.map(item => {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }
      if (dataPassed.length === 0) {
        return { itemPass, itemFail };
      }
      itemPass = await Promise.all(
        dataPassed.map(async (notification: UpdateNotificationDto, idx: number) => {
          const dateItem: number = getUpdateTimeByIndex(currentTime, idx);
          const respond = await this.
            notificationRepo.updateNotificationStatus({
              ...notification,
              updated_date: dateItem
            }, user);

          if (respond.error) {
            itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
              respond.error, notification));
            return;
          }
          itemLastModify = generateLastModifyItem(itemLastModify, 0, dateItem, user.id);
          return respond;
        }));
      // send last modified
      this.apiLastModifiedQueueService
        .sendLastModified(itemLastModify,
          ApiLastModifiedName.COLLECTION_ACTIVITY, headers);

      return { itemPass: itemPass.filter(Boolean), itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(
        ErrorCode.BAD_REQUEST, error.message);
      itemFail.push(errItem);
      return { itemPass, itemFail };
    }
  }

  async deleteBatchNotification(data: DeleteNotificationDto[], { user, headers }: IReq) {
    let itemPass = [];
    const itemFail = [];
    try {
      const currentTime: number = getUtcMillisecond();
      let itemLastModify: LastModify[] = [];
      const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['id']);
      if (dataError.length > 0) {
        dataError.map(item => {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }
      if (dataPassed.length === 0) {
        return { itemPass, itemFail };
      }
      itemPass = await Promise.all(
        dataPassed.map(async (noti: DeleteNotificationDto, idx: number) => {
          const dateItem: number = getUpdateTimeByIndex(currentTime, idx);
          const respond = await this.
            notificationRepo.deleteNotification({
              ...noti,
              deleted_date: dateItem
            }, user);

          if (respond.error) {
            itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
              respond.error, noti));
            return false;
          }
          // send last modified
          itemLastModify = generateLastModifyItem(itemLastModify, 0, dateItem, user.id);
          return respond;
        }));

      this.apiLastModifiedQueueService
        .sendLastModified(itemLastModify,
          ApiLastModifiedName.COLLECTION_ACTIVITY, headers);

      return { itemPass: itemPass.filter(Boolean), itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(
        ErrorCode.BAD_REQUEST, error.message);
      itemFail.push(errItem);
      return { itemPass, itemFail };
    }
  }

}