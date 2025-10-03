import { Injectable } from '@nestjs/common';
import { isObject } from 'class-validator';
import { ApiLastModifiedName, DELETED_ITEM_TYPE, OBJ_TYPE } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_CONTACT_HISTORY, MSG_ERR_DUPLICATE_ENTRY, MSG_ERR_WHEN_CREATE,
  MSG_ERR_WHEN_DELETE, MSG_FIND_NOT_FOUND
} from '../../common/constants/message.constant';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { Email365ObjectId, EmailObjectId, GeneralObjectId, GmailObjectId } from '../../common/dtos/object-uid';
import { ContactHistory } from '../../common/entities/contact-history.entity';
import { IReq } from '../../common/interfaces';
import { LoggerService } from '../../common/logger/logger.service';
import { ContactHistoryRepository } from '../../common/repositories/contact-history.repository';
import { filterDuplicateItemsWithKey, pickObject } from '../../common/utils/common';
import { generateDeletedDateByLength, getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { ThirdPartyAccountService } from '../third-party-account/third-party-account.service';
import { TrashService } from '../trash/trash.service';
import { CreateHistoryDTO } from './dtos/create-history.dto';
import { DeleteHistoryDTO } from './dtos/delete-history.dto';

export const SPECIAL_ACTION_ACCEPT = [4, 9, 7, 6];

@Injectable()
export class HistoryService {
  constructor(
    private readonly contactHistory: ContactHistoryRepository,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly thirdPartyAccountService: ThirdPartyAccountService,
    private readonly loggerService: LoggerService,
    private readonly deletedItem: DeletedItemService,
    private readonly trashService: TrashService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService) {
  }

  async getAllFiles(filter: BaseGetDTO, user_id: number) {
    const fields = filter.fields;
    delete filter.fields;
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const collections: ContactHistory[] = await this.databaseUtilitiesService.getAll({
      userId: user_id,
      filter,
      repository: this.contactHistory,
    });
    // convert buffer to string
    this.converBuffToString(collections);

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(user_id, DELETED_ITEM_TYPE.HISTORY, {
        modified_gte,
        modified_lt,
        ids,
        page_size
      });
    }

    return {
      data: pickObject(collections, fields),
      data_del: deletedItems,
    };
  }

  /* istanbul ignore next */
  private async converBuffToString(data: ContactHistory[]) {
    const newItem = await Promise.all(data.map(async (item: any) => {
      item.source_object_type = new GeneralObjectId({ uidBuffer: item.source_object_type })
        .getPlain();
      item.destination_object_type = new GeneralObjectId(
        { uidBuffer: item.destination_object_type }).getPlain();
      item.source_object_uid = new GeneralObjectId(
        { uidBuffer: item.source_object_uid }).getPlain();
      if (item.destination_object_type === OBJ_TYPE.GMAIL) {
        item.destination_object_uid = new GmailObjectId(
          { encryptedGmailIdBuf: item.destination_object_uid }).getPlain();
      } if (item.destination_object_type === OBJ_TYPE.EMAIL365) {
        item.destination_object_uid = new Email365ObjectId(
          { encryptedIdBuf: item.destination_object_uid }).getPlain();
      } else if (item.destination_object_type === OBJ_TYPE.EMAIL) {
        item.destination_object_uid = new EmailObjectId(
          { emailBuffer: item.destination_object_uid }).getPlain();
        if (item.destination_object_uid.path?.length === 0) {
          item.destination_object_uid = item.destination_object_uid.uid;
        }
      } else {
        item.destination_object_uid = new GeneralObjectId(
          { uidBuffer: item.destination_object_uid })
          .getPlain();
      }
    }));
    return newItem;
  }

  public convertDesObject(item, typeItem, is_specific_case) {
    if ((item?.length > 0 || isObject(item)) && typeItem?.length > 0) {
      switch (typeItem) {
        case OBJ_TYPE.EMAIL365:
          const destination = new Email365ObjectId({ id: item }).objectUid;
          return destination;
        case OBJ_TYPE.GMAIL:
          const destinationGmail = new GmailObjectId({ gmailId: item }).objectUid;
          return destinationGmail;

        case OBJ_TYPE.EMAIL:
          if (is_specific_case) {
            if (isObject(item)) {
              const obj = new EmailObjectId(item).objectUid;
              return obj;
            }
            const destinationEmail = new EmailObjectId({
              uid: item,
              path: ''
            }).objectUid;
            return destinationEmail;
          } else {
            const destinationEmail = new EmailObjectId(item).objectUid;
            return destinationEmail;
          }
        case OBJ_TYPE.VEVENT:
          const destinationVevent = new GeneralObjectId({ uid: item }).objectUid;
          return destinationVevent;
        default:
          throw Error(`Not support ${typeItem} typeItem`);
      }
    } else if (item?.length > 0 || typeItem?.length === 0) {
      return new GeneralObjectId({ uid: item }).objectUid;
    } else {
      return Buffer.from('');
    }
  }

  async createHistory(data: CreateHistoryDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const currentTime = getUtcMillisecond();
    const timeLastModify = [];
    const { dataPassed, dataError } = filterDuplicateItemsWithKey(data
      , ['action', 'source_object_type', 'destination_object_type', 'source_object_uid'
        , 'destination_object_uid', 'source_object_href', 'destination_object_href'
        , 'source_account_id', 'destination_account_id', 'action_data', 'path', 'is_trashed']);
    if (dataError.length > 0) {
      dataError.map(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    await Promise.all(dataPassed.map(async (item, idx) => {
      const {
        destination_object_uid,
        destination_object_type, destination_account_id,
        source_object_uid, source_account_id,
      } = item;
      try {
        if (destination_account_id > 0) {
          const isDestinationAccountId = await this.thirdPartyAccountService.
            findOneById(user.id, destination_account_id, { fields: ['id'] });
          if (!isDestinationAccountId) {
            const errNotFound = buildFailItemResponse(ErrorCode.INVALID_DES_ACCOUNT_ID,
              MSG_ERR_CONTACT_HISTORY.INVALID_DES_ACCOUNT, item);
            itemFail.push(errNotFound);
            return;
          }
        }
        if (source_account_id > 0) {
          const isSourceAccountId = await this.thirdPartyAccountService.
            findOneById(user.id, source_account_id, { fields: ['id'] });
          if (!isSourceAccountId) {
            const errNotFound = buildFailItemResponse(ErrorCode.INVALID_SRC_ACCOUNT_ID,
              MSG_ERR_CONTACT_HISTORY.INVALID_SOURCE_ACCOUNT, item);
            itemFail.push(errNotFound);
            return;
          }
        }

        const destinationObjectUidBuffer =
          this.convertDesObject(
            destination_object_uid,
            destination_object_type, (item as any).is_specific_case);

        const sourceObjectUidBuffer = new GeneralObjectId({
          uid: source_object_uid,
        }).objectUid;

        const sourceObjectTypeBuffer = new GeneralObjectId({
          uid: item.source_object_type,
        }).objectUid;

        const destinationObjectTypedBuffer = destination_object_type?.length > 0
          ? new GeneralObjectId({
            uid: destination_object_type,
          }).objectUid : '';

        const dateItem = getUpdateTimeByIndex(currentTime, idx);
        timeLastModify.push(dateItem);
        let is_trashed = item.is_trashed;
        if (is_trashed === undefined || is_trashed === null) {
          is_trashed = await this.trashService.getIsTrash(
            item.is_trashed,
            sourceObjectUidBuffer,
            item.source_object_type,
            item.source_object_href
          ) || await this.trashService.getIsTrash(
            item.is_trashed,
            destinationObjectUidBuffer,
            destination_object_type,
            item.destination_object_href
          );
        }
        const colEntity = this.contactHistory.create({
          user_id: user.id,
          destination_object_uid: destinationObjectUidBuffer,
          destination_object_type: destinationObjectTypedBuffer,
          source_object_uid: sourceObjectUidBuffer,
          source_object_type: sourceObjectTypeBuffer,
          source_account_id: item.source_account_id,
          destination_account_id: item.destination_account_id,
          source_object_href: item.source_object_href,
          destination_object_href: item.destination_object_href,
          action_data: item.action_data,
          action: item.action,
          path: item.path,
          created_date: dateItem,
          updated_date: dateItem,
          is_trashed
        });
        if ((await this.contactHistory.isExist(colEntity))) {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
          return;
        }
        const itemRespond: ContactHistory = await this.contactHistory.save(colEntity);
        // No return source_account_id and destination_account_id
        if (!itemRespond['source_account_id']) delete itemRespond['source_account_id'];
        if (!itemRespond['destination_account_id']) delete itemRespond['destination_account_id'];

        const parseItemRespond = {
          ...itemRespond,
          source_object_uid,
          source_object_type: item.source_object_type,
          destination_object_uid,
          destination_object_type,
          ref: item.ref
        };
        itemPass.push(parseItemRespond);
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_CREATE, item);
        this.loggerService.logError(error);
        itemFail.push(errItem);
      }
    }));

    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.CONTACT_HISTORY,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return { itemPass, itemFail };
  }

  async deleteHistory(data: DeleteHistoryDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];

    const deletedDates: number[] = generateDeletedDateByLength(data.length);
    const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['id']);
    if (dataError.length > 0) {
      dataError.map(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    await Promise.all(dataPassed.map(async (item, index) => {
      try {
        const itemHistory = await this.findItem({ where: { id: item.id, user_id: user.id } });

        if (!itemHistory) {
          const errItem = buildFailItemResponse(ErrorCode.HISTORY_NOT_FOUND,
            MSG_FIND_NOT_FOUND, item);
          itemFail.push(errItem);
        } else {
          const isInsertDeletedItem = await this.deletedItem.create(user.id,
            {
              item_id: item.id,
              item_type: DELETED_ITEM_TYPE.HISTORY,
              updated_date: deletedDates[index],
              created_date: deletedDates[index],
            });
          if (!isInsertDeletedItem) { // push item into itemFail if false
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
            itemFail.push(errItem);
          } else { // remove item in cloud table
            await this.contactHistory.delete({ id: itemHistory.id, user_id: user.id });
            itemPass.push({ id: itemHistory.id });
          }
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
        this.loggerService.logError(error);
        itemFail.push(errItem);
      }
    }));

    if (itemPass.length > 0) {
      const updatedDate = Math.max(...deletedDates);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.CONTACT_HISTORY,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return { itemPass, itemFail };
  }

  public findItem(reqParam) {
    return this.contactHistory.findOne(reqParam);
  }
}
