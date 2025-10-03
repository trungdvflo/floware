import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiLastModifiedName, DELETED_ITEM_TYPE } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_DUPLICATE_ENTRY
} from '../../common/constants/message.constant';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { GENERAL_OBJ, GeneralObjectId } from '../../common/dtos/object-uid';
import { CollectionHistory } from '../../common/entities/collection-history.entity';
import { IReq } from '../../common/interfaces';
import { CollectionHistoryRepository } from '../../common/repositories/collection-history.repository';
import {
  LastModify, filterDuplicateItemsWithKey, generateLastModifyItem
} from '../../common/utils/common';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse, modifyObjectUidAndType } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { CollectionObjectEvent, EventNames } from '../communication/events';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { CreateHistoryDto } from './dtos/history.create.dto';
import { DeleteHistoryDto } from './dtos/history.delete.dto';
@Injectable()
export class HistoryService {
  constructor(
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly historyRepo: CollectionHistoryRepository,
    private readonly deletedItem: DeletedItemService,
    private readonly eventEmitter: EventEmitter2
  ) { }

  async getAllHistories(filter: BaseGetDTO, { user, headers }: IReq) {
    try {
      let history: CollectionHistory[] = await this.historyRepo.getAllHistory({
        user,
        filter
      });
      let deletedItems;
      if (filter.has_del && filter.has_del === 1) {
        deletedItems = await this.deletedItem.findAll(user.id,
          DELETED_ITEM_TYPE.COLLECTION_HISTORY,
          {
            ids: filter.ids,
            modified_gte: filter.modified_gte,
            modified_lt: filter.modified_lt,
            page_size: filter.page_size
          }
        );
      }
      history = history.map(item => {
        if (!filter.fields || filter.fields.includes('object_uid')) {
          item.object_uid = new GeneralObjectId({
            uidBuffer: item.object_uid as Buffer
          }, item.object_type as GENERAL_OBJ).getPlain();
        }
        if (!filter.fields || filter.fields.includes('object_type')) {
          item.object_type = item.object_type.toString();
        }

        return item;
      });
      return {
        data: history,
        data_del: deletedItems
      };
    } catch (error) {
      const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message);
      return { data: [], error: errItem };
    }
  }

  async createBatchHistory(data: CreateHistoryDto[], { user, headers }: IReq) {
    const itemFail = [];
    const itemPass = [];
    try {
      const currentTime: number = getUtcMillisecond();
      let itemLastModify: LastModify[] = [];
      let idx: number = 0;
      for (const history of data) {
        const dateItem: number = getUpdateTimeByIndex(currentTime, idx++);
        const respond = await this.historyRepo
          .insertHistory({
            ...history,
            updated_date: dateItem,
            created_date: dateItem
          }, user);

        if (respond['error']) {
          itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
            respond['error'], {
            ...history,
            object_uid: history.object_uid.getPlain(),
            object_type: history.object_type.toString()
          }));
          continue;
        }

        // emit event when update share collection history
        this.eventEmitter.emit(EventNames.VCAL_SHARE_COLLECTION, {
          ...history,
          email: user.email,
          collection_activity_id: respond['collection_activity_id'],
          object_href: respond['object_href']
        } as CollectionObjectEvent);

        respond['object_uid'] = new GeneralObjectId({
          uidBuffer: respond['object_uid'] as Buffer
        }, respond['object_type'] as GENERAL_OBJ).getPlain();
        respond['object_type'] = respond['object_type'].toString();
        itemLastModify = generateLastModifyItem(itemLastModify,
          respond['collection_id'], dateItem);

        await this.historyRepo.createNotification({
          ...history,
          updated_date: dateItem,
          created_date: dateItem
        }, user);

        itemPass.push(modifyObjectUidAndType({
          ...respond,
          ref: history.ref,
          assignees: history.assignees || []
        }));
      }
      //
      this.apiLastModifiedQueueService
        .sendLastModifiedByCollectionId(itemLastModify,
          ApiLastModifiedName.COLLECTION_HISTORY, headers);

      return { itemPass: itemPass.filter(Boolean), itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST
        , error.message);
      itemFail.push(errItem);
      return { itemPass, itemFail };
    }
  }

  async deleteBatchHistory(data: DeleteHistoryDto[], { user, headers }: IReq) {
    let itemPass = [];
    const itemFail = [];
    try {
      const currentTime: number = getUtcMillisecond();
      let itemLastModify: LastModify[] = [];
      const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['id']);
      if (dataError.length > 0) {
        dataError.forEach(item => {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }
      if (dataPassed.length === 0) {
        return { itemPass, itemFail };
      }
      itemPass = await Promise.all(
        dataPassed.map(async (history: DeleteHistoryDto, idx: number) => {
          const dateItem: number = getUpdateTimeByIndex(currentTime, idx);
          const respond = await this.
            historyRepo.deleteHistory({
              ...history,
              updated_date: dateItem
            }, user);

          if (respond.error) {
            itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
              respond.error, history));
            return;
          }
          itemLastModify = generateLastModifyItem(itemLastModify,
            respond.collection_id, dateItem);
          delete respond.collection_id;
          return respond;
        }));
      this.apiLastModifiedQueueService
        .sendLastModifiedByCollectionId(itemLastModify,
          ApiLastModifiedName.COLLECTION_HISTORY, headers);
      return { itemPass: itemPass.filter(Boolean), itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(
        ErrorCode.BAD_REQUEST, error.message);
      itemFail.push(errItem);
      return { itemPass, itemFail };
    }
  }
}