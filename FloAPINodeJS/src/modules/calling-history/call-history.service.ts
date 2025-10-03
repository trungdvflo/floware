import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CALL_STATUS, DELETED_ITEM_TYPE, IS_OWNER } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_VIDEO_HISTORY, MSG_ERR_WHEN_CREATE,
  MSG_ERR_WHEN_DELETE, MSG_FIND_NOT_FOUND
} from '../../common/constants/message.constant';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { CallingHistory } from '../../common/entities/call-history.entity';
import { Users } from '../../common/entities/users.entity';
import { LoggerService } from '../../common/logger/logger.service';
import { filterDuplicateItemsWithKey } from '../../common/utils/common';
import { generateDeletedDateByLength, getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { CreateVideoCallDTO } from './dtos/create-call-history.dto';
import { DeleteCallingHistoryDTO } from './dtos/delete-call-history.dto';

@Injectable()
export class CallingHistoryService {
  constructor(
    @InjectRepository(CallingHistory) private readonly videoHistoryRepo: Repository<CallingHistory>,
    @InjectRepository(Users) private readonly userRepository: Repository<Users>,
    private readonly deletedItem: DeletedItemService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly loggerService: LoggerService
    ) { }

  async getAllFiles(filter: BaseGetDTO, user_id: number) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const collections: CallingHistory[] = await this.databaseUtilitiesService.getAll({
      userId: user_id,
      filter,
      repository: this.videoHistoryRepo,
    });

    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem.findAll(user_id, DELETED_ITEM_TYPE.VIDEO_CALL, {
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

  async findAllByInvitee(data: string[], user_id: number) {
    const itemPass = [];
    const itemFail = [];
    await Promise.all(data.map(async item => {
      const rs = await this.videoHistoryRepo.find({
        where: { invitee: item }
      });
      if (rs.length === 0) {
        const errNotFound = buildFailItemResponse(ErrorCode.INVITEE_NOT_FOUND,
          MSG_ERR_VIDEO_HISTORY.INVALID_INVITEE, item);
        return itemFail.push(errNotFound);
      }
      const inviteeObj = {};
      inviteeObj[item] = rs;
      return itemPass.push(inviteeObj);
    }));
    return { itemPass, itemFail };
  }

  async deleteMulItem(data: DeleteCallingHistoryDTO[], user_id: number) {
    const itemPass = [];
    const itemFail = [];
    const deletedDates: number[] = generateDeletedDateByLength(data.length);
    const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['room_id']);
    if (dataError.length > 0) {
      dataError.map(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    await Promise.all(dataPassed.map(async (item, index) => {
      try {
        const itemHistory = await this.videoHistoryRepo.find(
          { select: ['id'], where: { room_id: item.room_id, user_id } });

        if (itemHistory.length === 0) {
          const errItem = buildFailItemResponse(ErrorCode.ROOMID_NOT_FOUND,
            MSG_FIND_NOT_FOUND, item);
          itemFail.push(errItem);
        }
        await Promise.all(itemHistory.map(async childItemHistory => {
          const isInsertDeletedItem = await this.deletedItem.create(user_id,
            {
              item_id: childItemHistory.id,
              item_type: DELETED_ITEM_TYPE.VIDEO_CALL,
              updated_date: deletedDates[index],
              created_date: deletedDates[index],
            });
          if (!isInsertDeletedItem) { // push item into itemFail if false
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
              MSG_ERR_WHEN_DELETE, item);
            itemFail.push(errItem);
          } else { // remove item in cloud table
            await this.videoHistoryRepo.delete({ id: childItemHistory.id, user_id });
            itemPass.push({ id: childItemHistory.id });
          }
        }));
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_DELETE, item);
        this.loggerService.logError(error);
        itemFail.push(errItem);
      }
    }));
    return { itemPass, itemFail };
  }

  async createItem(data: CreateVideoCallDTO[], user_id: number) {
    const itemInvitee = [];
    const itemPass = [];
    const itemFail = [];

    await Promise.all(data.map(async (item: CreateVideoCallDTO, idx: number) => {
      try {
        const { is_owner, call_status, invitee } = item;
        const colOwnerEntity = this.createHistoryEntity(user_id, item, idx);
        if (item.ref) colOwnerEntity['ref'] = item.ref;
        itemPass.push(colOwnerEntity);

        if (is_owner === IS_OWNER.not_owner && call_status === CALL_STATUS.un_answer) {
          const { id } = await this.userRepository.findOne({
            select: ['id'], where: { email: invitee },
          });
          item.call_status = CALL_STATUS.miss_calling;
          const colEntity = this.createHistoryEntity(id, item, idx);
          itemInvitee.push(colEntity);
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, MSG_ERR_WHEN_CREATE, item);
        this.loggerService.logError(error);
        itemFail.push(errItem);
      }
    }));
    const combineEntity = itemPass.concat(itemInvitee);
    await this.videoHistoryRepo.insert(combineEntity);
    return { itemPass, itemFail };
  }

  private createHistoryEntity(user_id: number, item: CreateVideoCallDTO, idx: number) {
    const currentTime = getUtcMillisecond();
    const dateItem = getUpdateTimeByIndex(currentTime, idx);
    return this.videoHistoryRepo.create({
      user_id,
      organizer: item.organizer,
      invitee: item.invitee,
      room_url: item.room_url,
      room_id: item.room_id,
      call_start_time: item.call_start_time,
      call_end_time: item.call_end_time,
      call_status: item.call_status,
      call_type: item.call_type,
      is_owner: item.is_owner,
      attendees: item.attendees,
      created_date: dateItem,
      updated_date: dateItem
    });
  }
}
