import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { In } from 'typeorm';
import { v4 as uuidV4 } from 'uuid';
import {
  ApiLastModifiedName, CHAT_CHANNEL_TYPE,
  DELETED_ITEM_TYPE, PARTICIPANT
} from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_CONFERENCE_NOT_EDIT_PER,
  MSG_CONFERENCE_NOT_EXIST,
  MSG_ERR_DUPLICATE_ENTRY, MSG_ERR_WHEN_CREATE, MSG_NOT_FOUND_USER
} from '../../common/constants/message.constant';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { ConferenceMemberEntity } from '../../common/entities/conference-member.entity';
import { IReq, IUser } from '../../common/interfaces';
import { ConferenceMemberRepository, ConferenceRepository } from '../../common/repositories';
import { channelIDWithoutDuplicates, userIDWithoutDuplicates } from '../../common/utils/common';
import {
  getUpdateTimeByIndex,
  getUtcMillisecond,
  getUtcSecond
} from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import {
  ApiLastModifiedQueueService, LastModified, LastModifiedConference
} from '../bullmq-queue/api-last-modified-queue.service';
import {
  ChannelMember, ConferenceEvent, EventNames
} from '../communication/events';
import { ChannelType, ChatMember } from '../communication/interfaces';
import { ChimeChatService } from '../communication/services';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import { UsersService } from '../users/users.service';
import {
  CreateConferenceMemberDTO,
  DeleteConferenceMemberDTO,
  UpdateConferenceMemberDTO
} from './dtos';

@Injectable()
export class ConferenceMemberService {
  constructor(
    private readonly conferenceRepo: ConferenceRepository,
    private readonly conferenceMemberRepo: ConferenceMemberRepository,
    private readonly userService: UsersService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly databaseUtilitiesService: DatabaseUtilitiesService,
    private readonly chimeService: ChimeChatService,
    private readonly deletedItem: DeletedItemService,
    private readonly eventEmitter: EventEmitter2
  ) { }

  private isFloMail(email: string, user): boolean {
    const flo_email_domain = user.email.split('@')[1];
    if (!email || email.length <= 0) return false;
    const mail_domain = email.split('@')[1]?.trim().toLocaleLowerCase();
    return mail_domain === flo_email_domain;
  }

  async getMemberIDByChannelAndUser(channelId: number, userId: number): Promise<number> {
    const rs = await this.conferenceMemberRepo.findOne({
      select: ['id'],
      where: { channel_id: channelId, user_id: userId }
    });
    return rs?.id || 0;
  }

  private filterDuplicateItem(data: CreateConferenceMemberDTO[]) {
    const dataError = [];
    const dataFilter = data.filter((value, index, self) => {
      if (
        index ===
        self.findIndex(
          (t) =>
            t.email === value.email
            && t.channel_id === value.channel_id
        )
      ) {
        return value;
      }
      dataError.push(value);
    });
    return { dataFilter, dataError };
  }

  // private removeDuplicateUsers(userModifies: LastModifiedConference[]) {
  //   // Sort the array based on updatedDate in descending order
  //   userModifies.sort((a, b) => b.updatedDate - a.updatedDate);

  //   // Create a map to keep track of unique combinations of user_id and channel_id
  //   const uniqueMap = new Map();

  //   // Filter the array to remove duplicates
  //   const filteredArray = userModifies.filter(obj => {
  //     // Generate a unique key based on user_id and channel_id
  //     const key = `${obj.user_id}_${obj.channel_id}`;

  //     // If the key is already in the map, it's a duplicate
  //     if (uniqueMap.has(key)) {
  //       return false;
  //     }

  //     // Add the key to the map
  //     uniqueMap.set(key, true);
  //     return true;
  //   });
  //   console.log(filteredArray, 'filteredArrayfilteredArrayfilteredArrayfilteredArray');

  //   return filteredArray;
  // }

  private async pushLastModified(memberLastModifies, conferenceLastModifies, headers) {
    if (memberLastModifies.length > 0) {
      const lastModifiedWithoutDuplicates = userIDWithoutDuplicates(memberLastModifies);
      lastModifiedWithoutDuplicates.forEach(async (item) => {
        await this.apiLastModifiedQueueService.addJob({
          apiName: ApiLastModifiedName.CONFERENCE_MEMBER,
          userId: item.userId,
          email: item.email,
          updatedDate: item.updatedDate
        }, headers);
      });
    }

    if (conferenceLastModifies.length > 0) {
      const lastModifiedWithoutDuplicates = channelIDWithoutDuplicates(conferenceLastModifies);
      lastModifiedWithoutDuplicates.forEach(async (item) => {
        await this.apiLastModifiedQueueService.addJobConference({
          apiName: ApiLastModifiedName.CONFERENCING,
          userId: item.userId,
          updatedDate: item.updatedDate,
          channelId: item.channelId
        }, headers);
      });
    }
  }

  async getAll(filter: GetAllFilter<ConferenceMemberEntity>, user_id: number) {
    const { modified_gte, modified_lt, ids, page_size } = filter;

    const collections: ConferenceMemberEntity[] = await this.databaseUtilitiesService
      .getAllConferenceMember({
        userId: user_id,
        filter,
        repository: this.conferenceMemberRepo
      });
    let deletedItems;
    if (filter.has_del && filter.has_del === 1) {
      deletedItems = await this.deletedItem
        .findAll(user_id, DELETED_ITEM_TYPE.CONFERENCE_MEMBER, {
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

  async create(data: CreateConferenceMemberDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const memberLastModifies: LastModified[] = [];
    const conferenceLastModifies: LastModifiedConference[] = [];
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
      const currentTime = getUtcMillisecond();

      await Promise.all(lastData.map(async (item: CreateConferenceMemberDTO, idx) => {
        const { channel_id, email } = item;
        const is_creator = item.is_creator || 0;
        try {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          // check conference channel
          const confExisted: ConferenceMemberEntity = await this.conferenceMemberRepo
            .checkConferenceWithEmail(channel_id, email, user.userId);

          const { title } = await this.conferenceRepo.findOne({
            select: ['title'],
            where: { id: item.channel_id }
          });

          if (!confExisted || !confExisted.channel_id) {
            const errItem = buildFailItemResponse(ErrorCode.CONFERENCE_NOT_EXIST,
              MSG_CONFERENCE_NOT_EXIST, item);
            return itemFail.push(errItem);
          }
          if (confExisted.revoke_time === 0) {
            const errItem = buildFailItemResponse(ErrorCode.OBJECT_DUPLICATED,
              MSG_ERR_DUPLICATE_ENTRY, item);
            return itemFail.push(errItem);
          }
          {
            let member = null;
            if (confExisted.revoke_time > 0) {
              member = await this.addMemberAfterRevoked({
                confExisted, is_creator, dateItem, title,
                email, item, conferenceLastModifies
              });
            } else {
              member = await this.addNewMember({
                confExisted, user, dateItem, title,
                email, item, conferenceLastModifies
              }, itemFail);
            }
            if (member) itemPass.push(member);
          }
          const members = await this.conferenceMemberRepo.find({
            where: {
              channel_id: confExisted.channel_id
            }
          });
          for (const member of members) {
            memberLastModifies.push({
              userId: member.user_id,
              email: member.email,
              updatedDate: dateItem
            });
          }
        } catch (error) {
          let msg = MSG_ERR_WHEN_CREATE;
          if (error.code === 'ER_DUP_ENTRY') {
            msg = MSG_ERR_DUPLICATE_ENTRY;
          }
          const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, msg, item);
          itemFail.push(errItem);
        }
      }));

      if (itemPass?.length) {
        // add members to real-time channel
        this.eventEmitter.emit(EventNames.ADD_MEMBER_TO_CONFERENCE, {
          headers,
          confMembers: itemPass,
          dateItem: getUtcSecond(),
          type: ChannelType.CONFERENCE
        } as ConferenceEvent);
      }

      // call to Chime create member
      const chimeMember: ChatMember[] = itemPass?.map(
        (mm) => ({
          internal_channel_id: mm.channel_id,
          internal_channel_type: CHAT_CHANNEL_TYPE.CONFERENCE,
          internal_user_id: mm.user_id,
          internal_user_email: mm.email
        }));
      this.eventEmitter.emit(EventNames.CHATTING_CREATE_MEMBER, {
        headers,
        members: chimeMember
      } as ChannelMember);
      await this.pushLastModified(memberLastModifies, conferenceLastModifies, headers);
    }
    return {
      itemPass: itemPass?.map(item => {
        const cloneItem = { ...item };
        delete cloneItem.user_id;
        delete cloneItem.title;
        return cloneItem;
      }), itemFail
    };
  }

  private async addNewMember({
    confExisted, user, dateItem,
    title, email, item, conferenceLastModifies
  }: {
    confExisted: ConferenceMemberEntity,
    user: IUser,
    dateItem: number,
    title: string, email: string,
    item: CreateConferenceMemberDTO,
    conferenceLastModifies: LastModifiedConference[]
  }, itemFail) {

    let memberId = 0;
    if (this.isFloMail(email, user)) {
      const member = await this.userService.getUserIdByEmail(email);
      if (!member?.id) {
        const errItem = buildFailItemResponse(ErrorCode.USER_NOT_FOUND,
          MSG_NOT_FOUND_USER, item);
        itemFail.push(errItem);
        return;
      } else {
        memberId = member.id;
      }
    }
    item.uid = uuidV4();
    const entity = this.conferenceMemberRepo.create({
      ...item,
      user_id: memberId,
      channel_id: confExisted.channel_id,
      view_chat_history: confExisted['enable_chat_history'],
      title: confExisted.title,
      revoke_time: 0,
      join_time: dateItem,
      created_by: user.email,
      created_date: dateItem,
      updated_date: dateItem
    });

    const result = await this.conferenceMemberRepo.insert(entity);
    // update last_used
    await this.updateLastUsedChannelForConference(confExisted.channel_id, dateItem);

    conferenceLastModifies.push({
      userId: memberId,
      updatedDate: dateItem,
      channelId: confExisted.channel_id
    });

    return {
      id: result.raw.insertId,
      ...entity,
      title: title || '',
      uid: undefined,
      ref: item.ref
    };
  }

  private async addMemberAfterRevoked({
    confExisted, is_creator, dateItem,
    title, email, item, conferenceLastModifies
  }: {
    confExisted: ConferenceMemberEntity,
    is_creator: number,
    dateItem: number,
    title: string, email: string,
    item: CreateConferenceMemberDTO,
    conferenceLastModifies: LastModifiedConference[]
  }) {
    await this.conferenceMemberRepo.update({ id: confExisted.id }, {
      revoke_time: 0,
      is_creator,
      updated_date: dateItem
    });

    await this.updateLastUsedChannelForConference(confExisted.channel_id, dateItem);

    conferenceLastModifies.push({
      userId: confExisted.user_id,
      updatedDate: dateItem,
      channelId: confExisted.channel_id
    });

    return {
      id: confExisted.id,
      channel_id: confExisted.channel_id,
      title,
      revoke_time: 0,
      user_id: confExisted.user_id,
      created_by: confExisted.created_by,
      join_time: confExisted.join_time,
      is_creator: confExisted.is_creator,
      email,
      view_chat_history: confExisted['enable_chat_history'],
      created_date: confExisted.created_date,
      updated_date: dateItem,
      ref: item.ref
    };
  }

  private async updateLastUsedChannelForConference(channelId: number, updatedDate: number) {
    const conference = await this.conferenceRepo.findOneBy({ id: channelId });
    if (conference
      && conference.last_used < updatedDate
      && conference.updated_date < updatedDate) {
      // update updated date
      await this.conferenceRepo.update({ id: channelId }, {
        last_used: updatedDate,
        updated_date: updatedDate
      });
    }
  }

  async update(data: UpdateConferenceMemberDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const memberLastModifies: LastModified[] = [];
    const conferenceLastModifies: LastModifiedConference[] = []; // empty
    const currentTime = getUtcMillisecond();
    await Promise.all(data.map(async (item: UpdateConferenceMemberDTO, idx) => {
      try {
        const confExisted =
          await this.conferenceMemberRepo.checkConferenceWithMemberId(item.id, user.userId);
        if (!confExisted || !confExisted.channel_id) {
          const errNotFound = buildFailItemResponse(ErrorCode.CONFERENCE_NOT_EXIST,
            MSG_CONFERENCE_NOT_EXIST, item);
          itemFail.push(errNotFound);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          if (confExisted.is_creator === PARTICIPANT.TEMP) {
            if (confExisted.created_by !== user.email) {
              const errNotFound = buildFailItemResponse(ErrorCode.CONFERENCE_NOT_PERMISSION,
                MSG_CONFERENCE_NOT_EDIT_PER, item);
              return itemFail.push(errNotFound);
            }
          }

          await this.conferenceMemberRepo.update({ id: item.id }
            , { ...item, updated_date: dateItem });
          itemPass.push({ ...item, updated_date: dateItem });

          // prepare data for handle api last modify
          conferenceLastModifies.push({
            userId: confExisted.user_id,
            updatedDate: dateItem,
            channelId: confExisted.channel_id
          });

          const members = await this.conferenceMemberRepo.find({
            where: {
              channel_id: confExisted.channel_id
            }
          });

          for (const member of members) {
            memberLastModifies.push({
              userId: member.user_id,
              email: member.email,
              updatedDate: dateItem
            });
          }
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message, item);
        itemFail.push(errItem);
      }
    }));
    await this.pushLastModified(memberLastModifies, conferenceLastModifies, headers);

    return { itemPass, itemFail };
  }

  async remove(data: DeleteConferenceMemberDTO[], { user, headers }: IReq) {
    const itemPass = [];
    const itemFail = [];
    const memberLastModifies: LastModified[] = [];
    const conferenceLastModifies: LastModifiedConference[] = [];
    const currentTime = getUtcMillisecond();
    await Promise.all(data.map(async (item: DeleteConferenceMemberDTO, idx) => {
      try {
        const confExisted =
          await this.conferenceMemberRepo.checkConferenceWithMemberId(item.id, user.id);
        if (!confExisted || !confExisted.channel_id) {
          const errNotFound = buildFailItemResponse(ErrorCode.CONFERENCE_NOT_EXIST,
            MSG_CONFERENCE_NOT_EXIST, item);
          itemFail.push(errNotFound);
        } else {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          await this.conferenceMemberRepo.update({ id: item.id }
            , { ...item, updated_date: dateItem });
          itemPass.push({ ...item, updated_date: dateItem });

          conferenceLastModifies.push({
            userId: confExisted.user_id,
            updatedDate: dateItem,
            channelId: confExisted.channel_id
          });

          const members = await this.conferenceMemberRepo.find({
            where: {
              channel_id: confExisted.channel_id
            }
          });

          // remove member to real-time channel
          const deletedMember = members
            .find(({ id }) => id === item.id);
          this.eventEmitter.emit(EventNames.REVOKE_MEMBER_FROM_CONFERENCE, {
            headers,
            confMembers: [{
              ...deletedMember,
              // use to send to individual effective member
              title: deletedMember.title ?? confExisted.title ?? '',
              // use to send to remaining members
              share_title: confExisted.title
            }],
            dateItem: getUtcSecond(),
            type: ChannelType.CONFERENCE
          } as ConferenceEvent);
          for (const member of members) {
            memberLastModifies.push({
              userId: member.user_id,
              email: member.email,
              updatedDate: dateItem
            });
          }
        }
      } catch (error) {
        const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST,
          error.message, item);
        itemFail.push(errItem);
      }
    }));
    await this.pushLastModified(memberLastModifies, conferenceLastModifies, headers);
    // REMOVE CHIME
    const confMember = await this.conferenceMemberRepo.find({
      select: ['channel_id', 'user_id', 'email'],
      where: {
        id: In(itemPass.map(({ id }) => id))
      }
    });
    if (confMember?.length) {
      const chimeMember: ChatMember[] = confMember?.map(
        (mm) => ({
          internal_channel_id: mm.channel_id,
          internal_channel_type: CHAT_CHANNEL_TYPE.CONFERENCE,
          internal_user_id: mm.user_id,
          internal_user_email: mm.email
        }));
      this.chimeService.setHeader(headers)
        .batchRemoveMember(chimeMember);
    }
    return { itemPass, itemFail };
  }
}