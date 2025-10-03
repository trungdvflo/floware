import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import {
  CHECK_EXIST_CHANNEL_BY_MEMBER,
  CONFERENCE_HISTORY_STATUS_IN,
  CONFERENCE_HISTORY_STATUS_OUT,
  CREATE_CONFERENCE_HISTORY_SEND_INVITE,
  CREATE_CONFERENCE_HISTORY_SEND_INVITE_V2,
  LIST_OF_CONFERENCE_HISTORY
} from "../constants";
import { CustomRepository } from "../decorators/typeorm-ex.decorator";
import { BaseGetDTO, GetConferencePagingDTO } from "../dtos/base-get.dto";
import { ConferenceHistoryEntity } from "../entities/conference-history.entity";
import { IUser } from "../interfaces";
import { getPlaceholderByN } from "../utils/common";
type GetAllParams = {
  filter: BaseGetDTO,
  user: IUser,
  isDeleted?: boolean
};

type WebGetAllParams = {
  filter: GetConferencePagingDTO,
  user: IUser,
  isDeleted?: boolean
};
@Injectable()
@CustomRepository(ConferenceHistoryEntity)
export class ConferenceHistoryRepository extends Repository<ConferenceHistoryEntity> {

  /**
   * PROCEDURE `c2023_createConferenceHistorySendInviteV2`(pnChannelId  bigint(20)
   * ,pnUserId     bigint(20)
   * ,pnType       tinyint(1)
   * ,pvOrganizer  varchar(100)
   * ,pvInvitees   text
   * ,pvMeetingId  varchar(1000)) RETURNS int(11)
   * @param channelId
   * @param userId
   * @param type
   * @param organizer
   * @param emailList
   * @param meeting_id
   * @returns
   */
  async createConferenceHistoryForInviteeV2(channelId: number, userId: number,
    type: number, organizer: string, invitee: string[],
    meeting_id: string, external_meeting_id: string, updatedDate: number): Promise<{
      sendTo: string[],
      ignoreTo: string[]
    }> {
    const { callType, spName, spParam } = CREATE_CONFERENCE_HISTORY_SEND_INVITE_V2;
    const raws = await this.manager
      .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
        channelId,
        userId,
        type,
        organizer,
        invitee?.join(','),
        meeting_id,
        external_meeting_id,
        updatedDate
      ]);
    const result = raws.length ? raws[0][0] : {};
    return {
      sendTo: result.sendTo?.split(',')?.filter(Boolean) || [],
      ignoreTo: result.ignoreTo?.split(',')?.filter(Boolean) || []
    };
  }

  /**
   * PROCEDURE `c2023_createConferenceHistorySendInviteV2`(pnChannelId  bigint(20)
   * ,pnUserId     bigint(20)
   * ,pnType       tinyint(1)
   * ,pvOrganizer  varchar(100)
   * ,pvInvitees   text
   * ,pvMeetingId  varchar(1000)) RETURNS int(11)
   * @param channelId
   * @param userId
   * @param type
   * @param organizer
   * @param emailList
   * @param meeting_id
   * @returns
   */
  async createConferenceHistoryForInvitee(channelId: number, userId: number,
    type: number, organizer: string,
    meeting_id: string, external_meeting_id: string, updatedDate: number): Promise<string[]> {
    const { callType, spName, spParam } = CREATE_CONFERENCE_HISTORY_SEND_INVITE;
    const raws = await this.manager
      .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
        channelId,
        userId,
        type,
        organizer,
        meeting_id,
        external_meeting_id,
        updatedDate
      ]);
    return !raws.length
      ? []
      : raws[0][0]?.invitees?.split(',')?.filter(Boolean) || [];
  }

  async checkExistChannelByMember(channelId: number, userId: number, isReply: boolean = false) {

    const slaveConnection = this.manager
      .connection
      .createQueryRunner("slave");
    try {
      const { callType, spName, spParam } = CHECK_EXIST_CHANNEL_BY_MEMBER;
      const res = await slaveConnection
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)}) existed`, [
          channelId, userId
        ]);
      return res[0]?.existed || 0;
    } finally {
      slaveConnection.release();
    }
  }

  async listOfConferenceHistory({ filter, user }: WebGetAllParams) {
    const {
      ids = []
      , channel_ids = []
      , keyword = null
      , modified_gte = null
      , modified_lt = null
      , min_id = null
      , page_size = null
      , page_no = null
      , sort = null
      , group_meeting } = filter;
    const slaveConnection = this.manager
      .connection
      .createQueryRunner("slave");
    try {
      const { callType, spName, spParam } = LIST_OF_CONFERENCE_HISTORY;
      const raws = await slaveConnection
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          keyword
          , channel_ids.length ? channel_ids.join() : null
          , user.id
          , ids.length ? ids.join() : null
          , modified_gte
          , modified_lt
          , min_id
          , page_size
          , page_no
          , sort
          , group_meeting
        ]);
      const conference: ConferenceHistoryEntity[] = !raws.length ? [] : raws[0];
      return !conference.length ? []
        : this.pickObject(conference, group_meeting, filter.fields);
    } finally {
      slaveConnection.release();
    }
  }

  pickObject(cnf: ConferenceHistoryEntity[], group_meeting
    , fields: string[] = []): ConferenceHistoryEntity[] {
    return cnf.map((item: ConferenceHistoryEntity) => {
      const cleaned: ConferenceHistoryEntity = this.conferenceTransform(item, group_meeting);
      const respond: ConferenceHistoryEntity = new ConferenceHistoryEntity();
      if (!fields.length)
        return cleaned;
      fields.forEach(field => {
        respond[field] = cleaned[field];
      });
      return respond;
    });
  }

  private conferenceTransform(history: ConferenceHistoryEntity, group_meeting)
    : ConferenceHistoryEntity {
    if (!group_meeting && history.durations) {
      delete history.durations;
    }
    if (history.durations) {
      const durations = JSON.parse(history.durations as string);
      delete history.durations;
      if (Array.isArray(durations)) {
        history.duration = durations
          // filter call has duration
          .filter(({ start_time, end_time, status }) => [
            +CONFERENCE_HISTORY_STATUS_OUT.call_out_success,
            +CONFERENCE_HISTORY_STATUS_IN.call_in_success,
            +CONFERENCE_HISTORY_STATUS_IN.call_in_left
          ].includes(+status) && +end_time && +start_time)
          // call every duration
          .map(({ start_time, end_time }) => +new Date(end_time) - +new Date(start_time))
          // sum duration
          .reduce((total: number, item: number) => total + item, 0);
      }
    }
    return history;
  }
}