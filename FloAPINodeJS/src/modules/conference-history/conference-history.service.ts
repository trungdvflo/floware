import { BadRequestException, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import {
  ApiLastModifiedName,
  DELETED_ITEM_TYPE
} from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_CONFERENCE_NOT_EXIST,
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_NOT_EXIST,
  MSG_ERR_WHEN_CREATE,
  MSG_ERR_WHEN_DELETE
} from '../../common/constants/message.constant';
import { ConferenceHistoryEntity, ConferenceMemberEntity } from '../../common/entities';
import { IReq } from '../../common/interfaces';
import {
  ConferenceHistoryRepository,
  ConferenceMeetingRepository,
  ConferenceMemberRepository
} from '../../common/repositories';
import { filterDuplicateItemsWithKey } from '../../common/utils/common';
import { generateDeletedDateByLength, getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { InviteeParam } from '../conference-invite/dtos';
import { ConferenceMemberService } from '../conference-member/conference-member.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import {
  CreateConferenceHistoryDTO, DeleteConferenceHistoryDTO,
  GetConferenceHistoryPaging,
  ReplyConferenceHistoryDTO,
  UpdateConferenceHistoryDTO
} from './dtos';

interface LastModified {
  user_id: number;
  email: string;
  update_time: number;
}
@Injectable()
export class ConferenceHistoryService {
  constructor(
    private readonly confHisRepo: ConferenceHistoryRepository,
    private readonly conferenceMemberRepo: ConferenceMemberRepository,
    private readonly conferenceMeetingRepo: ConferenceMeetingRepository,
    private readonly confMemberService: ConferenceMemberService,
    private readonly deletedItemService: DeletedItemService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
  ) {

  }

  private filterDuplicateItem(data: DeleteConferenceHistoryDTO[]) {
    const dataError = [];
    const dataFilter = data.filter((value, index, self) => {
      if (
        index ===
        self.findIndex(
          (t) =>
            t.id === value.id
        )
      ) {
        return value;
      }
      dataError.push(value);
    });
    return { dataFilter, dataError };
  }

  private removeDuplicateUser(userModifies: LastModified[]) {
    return Array.from(
      userModifies.reduce((m, { user_id, email, update_time }) =>
        m.set(
          user_id,
          {
            email,
            update_time: Math.max(m.get(user_id)?.update_time || 0, update_time)
          }
        ), new Map()),
      ([user_id, { email, update_time }]) => ({ user_id, email, update_time })
    );
  }

  private pushLastModified(memberLastModifies, headers) {
    if (memberLastModifies.length > 0) {
      const lastModifiedWithoutDuplicates = this.removeDuplicateUser(memberLastModifies);
      lastModifiedWithoutDuplicates.forEach((item) => {
        this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.CONFERENCE_HISTORY,
          userId: item.user_id,
          email: item.email,
          updatedDate: item.update_time
        }, headers);
      });
    }
  }

  async getAll(filter: GetConferenceHistoryPaging<ConferenceHistoryEntity>,
    { user, headers }: IReq) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const histories: ConferenceHistoryEntity[] = await this.confHisRepo
      .listOfConferenceHistory({ filter, user });
    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItemService
        .findAll(user.id, DELETED_ITEM_TYPE.CONFERENCE_HISTORY, {
          ids,
          modified_gte,
          modified_lt,
          page_size
        });
    }
    return {
      data: histories?.map(history => {
        delete history.member_id;
        if (!filter.fields || filter.fields?.includes('attendees')) {
          try {
            history.attendees = (JSON.parse(history.lsAttendees) as InviteeParam[]) || [];
          } catch {
            history.attendees = [];
          }
          delete history.lsAttendees;
          return history;
        }
        delete history.lsAttendees;
        return history;
      }),
      data_del: deletedItems
    };
  }

  async create(data: CreateConferenceHistoryDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const memberLastModifies: LastModified[] = [];
    const { dataPassed, dataError } = filterDuplicateItemsWithKey(data,
      ['channel_id', 'meeting_id', 'type', 'status', 'start_time']);
    if (dataError.length > 0) {
      dataError.map(item => {
        const errItem = buildFailItemResponse(
          ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }

    if (dataPassed.length > 0) {
      const currentTime = getUtcMillisecond();

      await Promise.all(dataPassed.map(async (item: CreateConferenceHistoryDTO, idx) => {
        const { channel_id } = item;
        try {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          // check caller and member exist in conference channel
          const confExisted: ConferenceMemberEntity = await this.conferenceMemberRepo
            .checkConferenceWithEmail(channel_id, user.email, user.id);
          if (!confExisted?.channel_id
            || confExisted?.revoke_time > 0) {
            const errItem = buildFailItemResponse(ErrorCode.CONFERENCE_NOT_EXIST,
              MSG_CONFERENCE_NOT_EXIST, item);
            return itemFail.push(errItem);
          } else {
            // FB-2465
            const memberId = await this.confMemberService
              .getMemberIDByChannelAndUser(channel_id, user.id);
            //
            // get ConferenceMeeting
            const cMeetingId = await this.conferenceMeetingRepo
              .createIfNotExists(channel_id, item.meeting_id, item.external_meeting_id, user);

            const entity = this.confHisRepo.create({
              ...item,
              invitee: user.email,
              member_id: memberId,
              conference_meeting_id: cMeetingId,
              lsAttendees: JSON.stringify(item.attendees),
              user_id: user.id,
              created_date: dateItem,
              updated_date: dateItem
            });
            const result = await this.confHisRepo.insert(entity);

            delete entity.lsAttendees;
            delete entity.conference_meeting_id;
            itemPass.push({
              id: result.raw.insertId,
              ...entity,
              organizer: item.organizer || '',
              attendees: item.attendees || [],
              external_meeting_id: item.external_meeting_id || '',
              start_time: item.start_time || 0,
              end_time: item.end_time || 0,
              action_time: item.action_time || 0,
              status: item.status || 0,
              type: item.type || 0,
              member_id: undefined,
              user_id: undefined,
              uid: undefined,
              ref: item.ref
            });
            memberLastModifies.push({ user_id: user.id, email: user.email, update_time: dateItem });
          }
        } catch (error) {
          let msg = error.response?.message || MSG_ERR_WHEN_CREATE;
          if (error.code === 'ER_DUP_ENTRY') {
            msg = MSG_ERR_DUPLICATE_ENTRY;
          }
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, msg, item);
          itemFail.push(errItem);
        }
      }));
      this.pushLastModified(memberLastModifies, headers);
    }
    return { itemPass, itemFail };
  }

  async update(data: UpdateConferenceHistoryDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const timeLastModify = [];
    const currentTime = getUtcMillisecond();
    const itemDbs = await this.confHisRepo.find({
      where: {
        id: In(data.map(i => i.id)),
        user_id: user.id
      }
    });
    await Promise.all(data.map(async (item: UpdateConferenceHistoryDTO, idx) => {
      try {
        const itemMember = itemDbs.find(i => (i.id === item.id));
        if (!itemMember) {
          const errNotFound = buildFailItemResponse(ErrorCode.BAD_REQUEST,
            MSG_ERR_NOT_EXIST, item);
          itemFail.push(errNotFound);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          timeLastModify.push(dateItem);

          await this.confHisRepo.update({ id: item.id }, { ...item, updated_date: dateItem });
          try {
            itemMember.attendees = JSON.parse(itemMember.lsAttendees) as InviteeParam[];
          } catch {
            itemMember.attendees = [];
          }
          delete itemMember.lsAttendees;
          itemPass.push({
            ...itemMember,
            ...item,
            organizer: itemMember.organizer || '',
            attendees: itemMember.attendees || [],
            external_meeting_id: itemMember.external_meeting_id || '',
            start_time: item.start_time || itemMember.start_time || 0,
            end_time: item.end_time || itemMember.end_time || 0,
            action_time: item.action_time || itemMember.action_time || 0,
            status: item.status || itemMember.status || 0,
            type: itemMember.type || 0,
            member_id: undefined,
            user_id: undefined,
            uid: undefined,
            updated_date: dateItem
          });
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        itemFail.push(errItem);
      }
    }));
    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.CONFERENCE_HISTORY,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return { itemPass, itemFail };
  }

  async delete(data: DeleteConferenceHistoryDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const timeLastModify = [];
    const filterData = this.filterDuplicateItem(data);

    if (filterData && filterData.dataError.length > 0) {
      filterData.dataError.forEach(item => {
        const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
          MSG_ERR_DUPLICATE_ENTRY, item);
        itemFail.push(errItem);
      });
    }
    if (filterData && filterData.dataFilter.length > 0) {
      const lastData = filterData.dataFilter;
      const deletedDates: number[] = generateDeletedDateByLength(lastData.length);
      const itemDbs = await this.confHisRepo.find({
        where: {
          id: In(lastData.map(i => i.id)),
          user_id: user.id
        }
      });
      await Promise.all(lastData.map(async (item, index) => {
        try {
          const itemDb = itemDbs.find(i => (i.id === item.id));

          if (!itemDb) {
            const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
              MSG_ERR_NOT_EXIST, item);
            itemFail.push(errItem);
          } else {
            const isInsertDeletedItem = await this.deletedItemService.create(user.id, {
              item_id: item.id,
              item_type: DELETED_ITEM_TYPE.CONFERENCE_HISTORY,
              is_recovery: 0,
              created_date: deletedDates[index],
              updated_date: deletedDates[index]
            });
            if (!isInsertDeletedItem) { // push item into itemFail if false
              const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
                MSG_ERR_WHEN_DELETE, item);
              itemFail.push(errItem);
            } else { // remove item in cloud table
              await this.confHisRepo.delete({ id: itemDb.id, user_id: user.id });
              itemPass.push({ id: itemDb.id });
              timeLastModify.push(deletedDates[index]);
            }
          }
        } catch (error) {
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
          itemFail.push(errItem);
        }
      }));
    }
    if (timeLastModify.length > 0) {
      const updatedDate = Math.max(...timeLastModify);
      this.apiLastModifiedQueueService.addJob({
        apiName: ApiLastModifiedName.CONFERENCE_HISTORY,
        userId: user.id,
        email: user.email,
        updatedDate
      }, headers);
    }

    return { itemPass, itemFail };
  }

  async reply(data: ReplyConferenceHistoryDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const memberLastModifies: LastModified[] = [];

    if (data.length > 0) {
      const currentTime = getUtcMillisecond();

      await Promise.all(data.map(async (item: ReplyConferenceHistoryDTO, idx) => {
        const { channel_id } = item;
        try {
          // check caller and member exist in conference channel
          const confMembers: ConferenceMemberEntity[] =
            await this.conferenceMemberRepo.getMembers4Check(channel_id, user.userId);
          if (!confMembers?.length) {
            throw new BadRequestException({
              code: ErrorCode.CONFERENCE_NOT_EXIST,
              message: MSG_CONFERENCE_NOT_EXIST,
              attributes: item
            });
          }

          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          const entities: ConferenceHistoryEntity[] = [];
          await Promise.all(confMembers.map(async confMember => {
            entities.push(this.confHisRepo.create({
              ...item,
              user_id: confMember.user_id,
              invitee: user.email,
              member_id: confMember.id,
              is_reply: 1,
              created_date: dateItem,
              updated_date: dateItem
            }));
            memberLastModifies.push({
              user_id: confMember.user_id,
              email: confMember.email,
              update_time: dateItem
            });
          }));
          await this.confHisRepo.insert(entities);
          itemPass.push(item);

        } catch (error) {
          let msg = error.response?.message || MSG_ERR_WHEN_CREATE;
          if (error.code === 'ER_DUP_ENTRY') {
            msg = MSG_ERR_DUPLICATE_ENTRY;
          }
          const errItem = buildFailItemResponse(
            error.response?.code || ErrorCode.BAD_REQUEST,
            msg, item);
          itemFail.push(errItem);
        }
      }));
      this.pushLastModified(memberLastModifies, headers);
    }
    return { itemPass, itemFail };
  }
}