import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ApiLastModifiedName, CHAT_CHANNEL_TYPE, DELETED_ITEM_TYPE } from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  INVALID_REQUEST,
  MSG_ERR_CREATE_CHANNEL_FAILED,
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_REVOKE_MEMBER_FAILED,
  MSG_ERR_UPDATE_MEMBER_FAILED
} from '../../common/constants/message.constant';
import { BaseGetDTO } from '../../common/dtos/base-get.dto';
import { ErrorDTO } from '../../common/dtos/error.dto';
import { ChimeMeetingEntity } from '../../common/entities/chime-meeting.entity';
import {
  ConferenceMemberEntity,
  Participant
} from '../../common/entities/conference-member.entity';
import { HeaderAuth, IReq, IUser } from '../../common/interfaces';
import { ConferenceMemberRepository } from '../../common/repositories';
import { ChimeMeetingRepository } from '../../common/repositories/chime-meeting.repository';
import { ConferenceRepository } from '../../common/repositories/conference.repository';
import { MeetingRepository } from '../../common/repositories/meeting.repository';
import { filterDuplicateItemsWithKey } from '../../common/utils/common';
import {
  getUpdateTimeByIndex, getUtcMillisecond, getUtcSecond
} from '../../common/utils/date.util';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { ChatService } from '../chat-realtime/chat-realtime.service';
import {
  ConferenceEvent,
  CreateChannel,
  EventNames
} from '../communication/events';
import {
  ChannelType, ChannelTypeNumber,
  ChatChannel, ChatMember
} from '../communication/interfaces';
import { ChimeChatService } from '../communication/services';
import { DeletedItemService } from '../deleted-item/deleted-item.service';
import {
  CallPhoneDTO,
  ChannelCreateDto, CheckChannelDto, ChimeDto,
  LeaveChannelDto,
  MemberUpdateDto,
  MoveChannelDto, RemoveAttendeeDTO
} from './dtos';
import { ScheduleDTO } from './dtos/schedule.dto';
@Injectable()
export class ConferencingService {
  constructor(
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
    private readonly conferenceRepo: ConferenceRepository,
    private readonly conferenceMemberRepo: ConferenceMemberRepository,
    private readonly meetingRepository: MeetingRepository,
    private readonly deletedItem: DeletedItemService,
    private readonly chimeService: ChimeChatService,
    private readonly chatService: ChatService,
    private readonly chimeMeetingRepo: ChimeMeetingRepository,
    private readonly eventEmitter: EventEmitter2
  ) {
  }

  async validChimeToken(item: ChimeDto) {
    const itemMeeting = await this.meetingRepository.findOne({
      where: {
        external_attendee: item.externalAttendee,
        join_token: item.joinToken
      }
    });

    if (itemMeeting) {
      return {
        data: itemMeeting
      };
    }
    return {
      error: new ErrorDTO({
        code: ErrorCode.BAD_REQUEST,
        message: INVALID_REQUEST,
        attributes: item
      })
    };
  }

  async sendLastModified(user: IUser, headers: HeaderAuth, timeLastModify: number[]) {
    if (!timeLastModify.length) {
      return;
    }
    await this.apiLastModifiedQueueService.addJob({
      apiName: ApiLastModifiedName.CONFERENCING,
      userId: user.id,
      email: user.email,
      updatedDate: Math.max(...timeLastModify)
    }, headers);
  }

  async sendLastModifiedChannel(user: IUser, headers: HeaderAuth, timeLastModify: number,
    memberId: number = 0) {
    const { channel_id, is_creator } = await this.conferenceMemberRepo.findOneBy({ id: memberId });
    if (is_creator) {
      await this.apiLastModifiedQueueService.addJobConference({
        apiName: ApiLastModifiedName.CONFERENCING,
        userId: user.id,
        channelId: channel_id,
        updatedDate: timeLastModify
      }, headers);
    }
  }

  async handleListScheduleCall(filter: ScheduleDTO, { user }: IReq) {
    try {
      await this.chatService
        .checkPermissionBeforeChat(filter.channel_id, ChannelTypeNumber.CONFERENCE, user);
      const scheduleData: ChimeMeetingEntity[] =
        await this.chimeMeetingRepo.getSchedules({ user, filter });
      return {
        data: scheduleData
      };
    } catch (error) {
      const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message);
      return { data: [], error: errItem };
    }
  }

  async getAllChannels(filter: BaseGetDTO, { user, headers }: IReq) {
    try {
      // list all member channels
      const channels: ConferenceMemberEntity[] =
        await this.conferenceRepo.listOfConference({ user, filter });
      // list all participants
      const participants: Participant[] = channels.length === 0
        ? []
        : await this.conferenceMemberRepo
          .getListParticipantByChannelId(
            channels.map(({ channel_id }) => channel_id)
              .filter(Boolean)
          );

      let deletedItems;
      if (filter.has_del && filter.has_del === 1) {
        deletedItems = await this.deletedItem.findAll(user.id,
          DELETED_ITEM_TYPE.CONFERENCING,
          {
            ids: filter.ids,
            modified_gte: filter.modified_gte,
            modified_lt: filter.modified_lt,
            page_size: filter.page_size
          }
        );
      }
      const data = this.cookParticipantForEachChannel(channels, participants);
      return {
        data,
        data_del: deletedItems
      };
    } catch (error) {
      const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST, error.message);
      return { data: [], error: errItem };
    }
  }

  cookParticipantForEachChannel(channel: ConferenceMemberEntity[],
    participants: Participant[]) {
    if (!channel?.length) return [];
    if (!participants?.length) return channel;
    return channel.map(ch => {
      ch.participants = participants
        .filter(p => p.channel_id === ch.channel_id)
        .map(p => ({
          id: p.id,
          email: p.email,
          is_creator: p.is_creator,
          revoke_time: p.revoke_time
        }));
      return ch;
    }
    );
  }

  async createBatchChannel(data: ChannelCreateDto[], { user, headers }: IReq) {
    try {
      const itemFail = [];
      const itemPass = [];
      const currentTime: number = getUtcMillisecond();
      const timeLastModify: number[] = [];
      let idx: number = 0;
      for (const channel of data) {
        const dateItem: number = getUpdateTimeByIndex(currentTime, idx++);
        timeLastModify.push(dateItem);

        const respond = await this.conferenceRepo
          .insertChannel({
            ...channel,
            updated_date: dateItem,
            created_date: dateItem
          }, user);
        if (respond.error) {
          itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
            MSG_ERR_CREATE_CHANNEL_FAILED, channel));
          continue;
        }
        // Create channel for real-time
        const realtimeChannel = await this.eventEmitter
          .emitAsync(EventNames.CREATE_REALTIME_CHANNEL, {
            headers,
            channelId: respond.channel_id,
            title: respond.title || respond.share_title,
            type: ChannelType.CONFERENCE,
            members: [{ email: user.email }]
          } as CreateChannel);

        if (realtimeChannel.length) {
          const { channel: rChannel, error } = realtimeChannel[0] || {
            channel: null, error: null
          };
          if (error) {
            itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
              error?.message, rChannel));
            continue;
          }

          await this.conferenceRepo
            .updateRealtimeChannel(rChannel?.name, respond.channel_id);

          itemPass.push({
            ...respond,
            realtime_channel: rChannel?.name
          });
        }
      }
      // call to Chime create channel
      const channels: ChatChannel[] = itemPass.map(
        ({ channel_id, title, id }) => ({
          internal_title: title,
          internal_channel_id: channel_id,
          internal_channel_type: CHAT_CHANNEL_TYPE.CONFERENCE,
          ref: id
        }));

      // background thread
      this.chimeService
        .setHeader(headers)
        .batchCreateChannel(channels, user);
      //
      this.sendLastModified(user, headers, timeLastModify);
      return { itemPass: itemPass.filter(Boolean), itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(ErrorCode.BAD_REQUEST
        , error.message);
      return { data: [], error: errItem };
    }
  }

  async updateBatchMember(data: MemberUpdateDto[], { user, headers }: IReq) {
    try {
      const itemFail = [];
      const itemPass = [];
      const currentTime: number = getUtcMillisecond();
      const timeLastModify: number[] = [];
      let idx: number = 0;
      for (const member of data) {
        const dateItem: number = getUpdateTimeByIndex(currentTime, idx++);
        timeLastModify.push(dateItem);
        const respond = await this.conferenceRepo
          .updateMember({
            ...member,
            updated_date: dateItem
          }, user);
        if (respond.error) {
          itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
            MSG_ERR_UPDATE_MEMBER_FAILED, member));
          continue;
        }
        itemPass.push(respond);
        this.sendLastModifiedChannel(user, headers, dateItem, member.id);
      }
      //
      this.sendLastModified(user, headers, timeLastModify);

      return { itemPass: itemPass.filter(Boolean), itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(
        ErrorCode.BAD_REQUEST, error.message);
      return { data: [], error: errItem };
    }
  }

  async deleteBatchMember(data: LeaveChannelDto[], { user, headers }: IReq) {
    try {
      const itemPass = [];
      const itemFail = [];
      const currentTime: number = getUtcMillisecond();
      const timeLastModify: number[] = [];
      const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['id']);
      if (dataError.length > 0) {
        dataError.forEach(item => {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }
      if (dataPassed.length > 0) {
        let idx: number = 0;
        for (const member of dataPassed) {
          const dateItem: number = getUpdateTimeByIndex(currentTime, idx++);
          timeLastModify.push(dateItem);
          const respond = await this.
            conferenceRepo.leaveChannel({
              ...member,
              updated_date: dateItem
            }, user);
          // SOON: build fail func
          if (respond.error) {
            itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
              MSG_ERR_REVOKE_MEMBER_FAILED, member));
            continue;
          }
          itemPass.push(respond);
        }

        if (itemPass?.length) {
          // remove member to real-time channel
          const eventData: ConferenceEvent = {
            headers,
            confMembers: itemPass,
            dateItem: getUtcSecond(),
            type: ChannelType.CONFERENCE
          };
          this.eventEmitter.emit(EventNames.DELETE_CONFERENCE_CHANNEL, eventData);
          // remove member to Chime
          const chimeMember: ChatMember[] = itemPass?.map(
            (mm) => ({
              internal_channel_id: mm.channel_id,
              internal_channel_type: CHAT_CHANNEL_TYPE.CONFERENCE,
              internal_user_id: mm.user_id,
              internal_user_email: mm.email
            }));
          this.chimeService.setHeader(headers)
            .batchRemoveMember(chimeMember);
        }
      }
      //
      this.sendLastModified(user, headers, timeLastModify);
      return { itemPass: itemPass.map(({ id }) => ({ id })), itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(
        ErrorCode.BAD_REQUEST, error.message);
      return { data: [], error: errItem };
    }
  }

  async checkChannel(channel: CheckChannelDto, { user, headers }: IReq) {
    try {
      const itemPass = [];
      const itemFail = [];

      const respond = await this.
        conferenceRepo.checkChannel({
          ...channel
        }, user);
      if (respond.error) {
        itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
          respond.error, channel));
      } else {
        itemPass.push(respond);
      }
      //
      return { itemPass, itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(
        ErrorCode.BAD_REQUEST, error.message);
      return { data: [], error: errItem };
    }
  }

  async moveBatchChannel(data: MoveChannelDto[], { user, headers }: IReq) {
    try {
      const itemPass = [];
      const itemFail = [];
      const currentTime: number = getUtcMillisecond();
      const timeLastModify: number[] = [];
      const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['collection_id', 'channel_uid']);
      if (dataError.length > 0) {
        dataError.forEach(item => {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }
      if (dataPassed.length > 0) {
        let idx: number = 0;
        for (const channel of dataPassed) {
          const dateItem: number = getUpdateTimeByIndex(currentTime, idx++);
          timeLastModify.push(dateItem);
          const respond = await this.
            conferenceRepo.moveChannel(channel, user);
          if (respond.error) {
            itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
              respond.error, channel));
            continue;
          }
          itemPass.push(respond);
        }
      }
      //
      this.sendLastModified(user, headers, timeLastModify);
      return { itemPass, itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(
        ErrorCode.BAD_REQUEST, error.message);
      return { data: [], error: errItem };
    }
  }

  async callPhone(data: CallPhoneDTO[], { headers }: IReq) {
    try {
      const itemPass = [];
      const itemFail = [];

      const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['phone_number', 'meeting_id']);
      if (dataError.length > 0) {
        dataError.forEach(item => {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }
      if (dataPassed.length > 0) {

        await Promise.all(dataPassed.map(async phone => {
          const respond = await this.chimeService.setHeader(headers)
            .callMobile(phone);
          if (!respond || respond.error) {
            itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
              respond.error, phone));
            return;
          }
          itemPass.push({
            ...phone,
            attendee_id: respond?.data?.attendee?.Attendee?.AttendeeId || '',
          });
        }));
      }
      return { itemPass, itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(
        ErrorCode.BAD_REQUEST, error.message);
      return { data: [], error: errItem };
    }
  }

  async removeAttendee(data: RemoveAttendeeDTO[], { headers }: IReq) {
    try {
      const itemPass = [];
      const itemFail = [];

      const { dataPassed, dataError } = filterDuplicateItemsWithKey(data, ['attendee_id', 'meeting_id']);
      if (dataError.length > 0) {
        dataError.forEach(item => {
          const errItem = buildFailItemResponse(ErrorCode.DUPLICATE_ENTRY,
            MSG_ERR_DUPLICATE_ENTRY, item);
          itemFail.push(errItem);
        });
      }
      if (dataPassed.length > 0) {
        for (const attendee of dataPassed) {
          const respond = await this.chimeService.setHeader(headers)
            .removeAttendee(attendee);
          if (respond.error) {
            itemFail.push(buildFailItemResponse(ErrorCode.BAD_REQUEST,
              respond.error?.message, attendee));
            continue;
          }
          itemPass.push(attendee);
        }
      }
      return { itemPass, itemFail };
    } catch (error) {
      const errItem = buildFailItemResponse(
        ErrorCode.BAD_REQUEST, error.message);
      return { data: [], error: errItem };
    }
  }
}