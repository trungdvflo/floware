import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiLastModifiedName, HISTORY_ACTION } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_COLLECTION_SAME,
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_NOT_EXIST
} from '../../common/constants/message.constant';
import { IReq } from '../../common/interfaces';
import { CollectionActivityRepository } from '../../common/repositories/collection-activity.repository';
import { generateLastModifyItem } from '../../common/utils/common';
import {
  STEP_MODIFY,
  getUtcSecond
} from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { CollectionObjectEvent, EventNames } from '../communication/events';
import { MoveCollectionActivityDTO } from './dtos/collection-activity.put.dto';

@Injectable()
export class CollectionActivityService {
  constructor(
    private readonly activityRepo: CollectionActivityRepository,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly eventEmitter: EventEmitter2
  ) { }

  public filterDuplicateItem(data: MoveCollectionActivityDTO[]) {
    const dataError = [];
    const dataFilter = data.filter((value, index, self) => {
      if (
        index ===
        self.findIndex(
          (t) =>
            t.collection_activity_id === value.collection_activity_id
        )
      ) {
        return value;
      }
      dataError.push(value);
    });
    return { dataFilter, dataError };
  }

  async moveActivity(data: MoveCollectionActivityDTO[], { user, headers }: IReq) {
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
      let dateItem = getUtcSecond();
      let timeLastModify = [];
      let timeLastModifyNoti = [];
      let timeLastModifyComment = [];
      for (const item of lastData) {
        try {
          const moveResult = await
            this.activityRepo.move(item, user, dateItem);
          if (!moveResult || moveResult.old_collection_id < 0) {
            const errNotFound = buildFailItemResponse(ErrorCode.COLLECTION_NOT_FOUND,
              MSG_ERR_NOT_EXIST, item);
            itemFail.push(errNotFound);
          } else if (moveResult.old_collection_id === item.collection_id) {
            const errNotFound = buildFailItemResponse(ErrorCode.COLLECTION_SAME,
              MSG_ERR_COLLECTION_SAME, item);
            itemFail.push(errNotFound);
          } else {
            dateItem = moveResult.max_updated_date;
            itemPass.push({
              collection_activity_id: item.collection_activity_id,
              collection_id: item.collection_id,
              object_uid: item.object_uid.getPlain(),
              object_href: moveResult.object_href,
              updated_date: dateItem
            });

            // emit event when move share collection activity
            this.eventEmitter.emit(EventNames.VCAL_SHARE_COLLECTION, {
              collection_id: item.collection_id,
              collection_activity_id: item.collection_activity_id,
              object_href: moveResult.object_href,
              content: item.content,
              object_type: moveResult.object_type,
              object_uid: item.object_uid,
              action: +HISTORY_ACTION.CREATED,
              action_time: dateItem,
              assignees: [],
              email: user.email,
            } as CollectionObjectEvent);

            timeLastModify = generateLastModifyItem(timeLastModify,
              item.collection_id, dateItem);
            timeLastModify = generateLastModifyItem(timeLastModify,
              moveResult.old_collection_id, dateItem);
            if (moveResult.has_comment) {
              timeLastModifyComment = generateLastModifyItem(timeLastModifyComment,
                item.collection_id, dateItem);
              timeLastModifyComment = generateLastModifyItem(timeLastModifyComment,
                moveResult.old_collection_id, dateItem);
            }
            dateItem += STEP_MODIFY;
            timeLastModifyNoti = generateLastModifyItem(timeLastModifyNoti,
              item.collection_id, dateItem);
            timeLastModifyNoti = generateLastModifyItem(timeLastModifyNoti,
              moveResult.old_collection_id, dateItem);
          }
        } catch (error) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
          itemFail.push(errItem);
        }
      }

      this.apiLastModifiedQueueService
        .sendLastModifiedByCollectionId(timeLastModifyNoti,
          ApiLastModifiedName.COLLECTION_ACTIVITY, headers);

      this.apiLastModifiedQueueService
        .sendLastModifiedByCollectionId(timeLastModify,
          ApiLastModifiedName.COLLECTION_HISTORY, headers);

      this.apiLastModifiedQueueService
        .sendLastModifiedByCollectionId(timeLastModifyComment,
          ApiLastModifiedName.COLLECTION_COMMENT, headers);
    }
    return { itemPass, itemFail };
  }
}