import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { v4 as uuidV4 } from 'uuid';
import { CheckChannelDto } from "../../modules/conference-channel/dtos/channel.check.dto";
import { ChannelCreateDto } from "../../modules/conference-channel/dtos/channel.create.dto";
import { LeaveChannelDto } from "../../modules/conference-channel/dtos/channel.leave.dto";
import { MoveChannelDto } from "../../modules/conference-channel/dtos/channel.move.dto";
import { MemberUpdateDto } from "../../modules/conference-channel/dtos/member.update.dto";
import {
  CHECK_EXIST_CHANNEL_BY_MEMBER,
  DELETED_ITEM_TYPE,
  LIST_OF_CONFERENCE,
  PROC_CREATE_CHANNEL,
  PROC_LEAVE_CHANNEL, PROC_UPDATE_MEMBER,
  SP_CHECK_CHANNEL_EXIST,
  SP_MOVE_CHANNEL
} from "../constants";
import { MSG_ERR_LINK, MSG_INVALID_CHANNEL_ID } from "../constants/message.constant";
import { CustomRepository } from "../decorators/typeorm-ex.decorator";
import { BaseGetDTO, GetConferencePagingDTO } from "../dtos/base-get.dto";
import { GENERAL_OBJ, GeneralObjectId } from "../dtos/object-uid";
import { ConferenceChannelEntity } from "../entities/conference-channel.entity";
import { ConferenceMemberEntity } from "../entities/conference-member.entity";
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
@CustomRepository(ConferenceChannelEntity)
export class ConferenceRepository extends Repository<ConferenceChannelEntity> {

  updateRealtimeChannel(realtime_channel: string, channelId: number) {
    return this.update(channelId, { realtime_channel });
  }

  async listOfConference({ filter, user }: WebGetAllParams) {
    const {
      ids = []
      , collection_ids = []
      , channel_ids = []
      , channel_uids = []
      , filter_type = null
      , keyword = null
      , emails = null
      , modified_gte = null
      , modified_lt = null
      , min_id = null
      , page_size = null
      , page_no = null
      , sort = null
      , vip } = filter;

    const { callType, spName, spParam } = LIST_OF_CONFERENCE;
    const slaveConnection = this.manager
      .connection
      .createQueryRunner("slave");
    try {
      const raws = await slaveConnection
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          keyword
          , emails
          , filter_type
          , collection_ids.length ? collection_ids.join() : null
          , channel_ids.length ? channel_ids.join() : null
          , channel_uids.length ? channel_uids.join() : null
          , user.id
          , ids.length ? ids.join() : null
          , modified_gte
          , modified_lt
          , min_id
          , vip
          , page_size
          , page_no
          , sort
        ]);
      const conference: ConferenceMemberEntity[] = !raws.length ? [] : raws[0];
      return !conference.length ? []
        : this.pickObject(user, conference, filter.fields);
    } finally {
      slaveConnection.release();
    }
  }

  pickObject(user: IUser, cnf: ConferenceMemberEntity[], fields: string[] = [])
    : ConferenceMemberEntity[] {
    return cnf.map((item: ConferenceMemberEntity) => {
      const cleaned: ConferenceMemberEntity = this.conferenceTransform(item);
      const respond: ConferenceMemberEntity = new ConferenceMemberEntity();
      if (!fields.length)
        return cleaned;
      fields.forEach(field => {
        respond[field] = cleaned[field];
      });
      return respond;
    });
  }

  private conferenceTransform(conf: ConferenceMemberEntity): ConferenceMemberEntity {
    return {
      ...conf,
      participants: typeof conf.participants === 'string'
        ? JSON.parse(conf.participants as string)
        : conf.participants
    };
  }
  /**
   * DEPRECATED
   */
  async getAllChannel({ filter, user }: GetAllParams) {
    const { modified_gte, modified_lt, min_id, page_size, fields, ids }
      = filter;
    const aliasChannel: string = 'cc';
    const aliasMember: string = 'cm';

    const fieldMember: string[] = [
      'id', 'channel_id', 'uid', 'email', 'is_creator', 'description', 'vip',
      'revoke_time', 'updated_date', 'created_date'
    ].filter(f => !fields
      ? true
      : fields.includes(f))
      .map((f: string) => `${aliasMember}.${f} as ${f}`);

    const fieldChannel: string[] = ['room_url']
      .filter(f => !fields ? true : fields.includes(f))
      .map((f: string) => `${aliasChannel}.${f} as ${f}`);

    let query = this.createQueryBuilder(aliasMember)
      .select(fieldMember)
      .addSelect(fieldChannel)
      .addSelect(!fields || fields.includes('title')
        ? `COALESCE(${aliasMember}.title, ${aliasChannel}.title, '') as title`
        : '')
      .innerJoin(ConferenceChannelEntity, aliasChannel, `${aliasMember}.channel_id = ${aliasChannel}.id`)
      .where(`${aliasMember}.user_id = :userId`, { userId: user.id });
    // other null revoke_time | get for my self
    query = query.andWhere(`(${aliasMember}.revoke_time is null
      or (${aliasMember}.revoke_time is not null
      and ${aliasMember}.user_id = :userId))`, { userId: user.id });

    if (modified_lt || modified_lt === 0) {
      query = query.andWhere(`${aliasMember}.updated_date < :modified_lt`, { modified_lt });
      query = query.addOrderBy(`${aliasMember}.updated_date`, "DESC");
    }
    if (modified_gte || modified_gte === 0) {
      query = query.andWhere(`${aliasMember}.updated_date >= :modified_gte`, { modified_gte });
      query = query.addOrderBy(`${aliasMember}.updated_date`, "ASC");
    }
    if (min_id || min_id === 0) {
      query = query.andWhere(`${aliasMember}.id > :min_id`, { min_id });
      query = query.addOrderBy(`${aliasMember}.id`, "ASC");
    }
    if (ids) {
      query = query.andWhere(`${aliasMember}.id IN (:...ids)`, { ids });
    }
    return query.limit(page_size).getRawMany();
  }

  async updateMember(member: MemberUpdateDto, user: IUser) {
    try {
      const { callType, spName, spParam } = PROC_UPDATE_MEMBER;
      const saved = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          member.id
          , user.userId
          , member.title
          , member.share_title
          , member.description
          , member.avatar
          , member.vip
          , member.room_url
          , member.updated_date
          , member.enable_chat_history
        ]);
      const updated = saved.length && saved[0].length ? saved[0][0] : {};
      if (updated.id === 0) {
        return { error: MSG_INVALID_CHANNEL_ID };
      }
      return {
        ...member,
        ...updated
      };
    } catch (error) {
      return { error };
    }
  }
  async leaveChannel(member: LeaveChannelDto, user: IUser) {
    try {
      const { callType, spName, spParam } = PROC_LEAVE_CHANNEL;
      const saved = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          member.id
          , user.userId
          , DELETED_ITEM_TYPE.CONFERENCING
          , member.updated_date
        ]);
      const updated = saved.length && saved[0].length ? saved[0][0] : {};
      if (updated.id === 0) {
        return { error: 'id id not found' };
      }
      return updated;
    } catch (error) {
      return { error };
    }
  }
  async insertChannel(channel: ChannelCreateDto, user: IUser) {
    try {
      const { callType, spName, spParam } = PROC_CREATE_CHANNEL;
      const uid: string = uuidV4();
      const saved = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          user.userId
          , uid
          , user.email
          , channel.title || null
          , channel.share_title || null
          , channel.description
          , channel.avatar
          , channel.vip
          , channel.room_url
          , channel.created_date
          , channel.updated_date
          , channel.enable_chat_history
        ]);
      const updated = saved.length && saved[0].length ? saved[0][0] : {};
      return {
        ...channel,
        uid,
        revoke_time: 0,
        ...updated
      };
    } catch (error) {
      return { error };
    }
  }

  async checkChannel(channel: CheckChannelDto, user: IUser) {
    try {
      const { callType, spName, spParam } = SP_CHECK_CHANNEL_EXIST;
      const emails = !channel.participants?.length ? ''
        : channel.participants?.map(({ email }) => email).join();
      const saved = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          emails
          , channel.participants.length || 0
          , user.userId
          , user.email
        ]);
      const updated = saved.length && saved[0].length ? saved[0][0] : {};

      if (!updated || updated?.id < 1) {
        return { error: MSG_INVALID_CHANNEL_ID };
      }
      return {
        ...updated,
        ...channel
      };
    } catch (error) {
      return { error };
    }
  }

  async moveChannel(channel: MoveChannelDto, user: IUser) {
    try {
      const { callType, spName, spParam } = SP_MOVE_CHANNEL;
      const saved = await this.manager
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          channel.collection_id
          , channel.channel_uid
          , user.userId
          , user.email
        ]);
      const updated = saved.length && saved[0].length ? saved[0][0] : {};

      if (!updated || updated?.id < 1) {
        return this.getMoveErrorMessageByCode(updated?.id || 0);
      }

      updated.object_uid = new GeneralObjectId({
        uidBuffer: updated.object_uid as Buffer
      }, updated.object_type as GENERAL_OBJ).getPlain();

      updated.object_type = updated.object_type.toString();

      return {
        ...channel,
        ...updated
      };
    } catch (error) {
      return { error };
    }
  }

  async checkExistChannelByMember(channelId: number, userId: number, isReply: boolean = false) {
    if (isReply) {
      // Check only the existence of conference_channel with the provided channelId
      const channel = await this
        .findOne({
          select: ['id'],
          where: { id: channelId }
        });
      return channel?.id > 0;
    }
    const slaveConnection = this.manager
      .connection
      .createQueryRunner("slave");
    try {
      const { callType, spName, spParam } = CHECK_EXIST_CHANNEL_BY_MEMBER;
      const res = await slaveConnection
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)}) existed`, [
          channelId,
          userId,
          +isReply || 0
        ]);
      return res[0]?.existed || 0;
    } finally {
      slaveConnection.release();
    }
  }
  getMoveErrorMessageByCode(code: string)
    : { error: string } {
    return {
      error: {
        '-1': MSG_INVALID_CHANNEL_ID,
        '0': MSG_ERR_LINK.COLLECTION_NOT_EXIST
      }[code]
    };
  }
}