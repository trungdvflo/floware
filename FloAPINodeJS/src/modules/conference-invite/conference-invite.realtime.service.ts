import { BadRequestException, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ApiLastModifiedName,
  CHAT_CHANNEL_TYPE,
  REPLY_SEND_STATUS,
  SEND_STATUS
} from '../../common/constants';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_DATA_INVALID,
  MSG_INVALID_CHANNEL_ID
} from '../../common/constants/message.constant';
import { ChimeChatChannelEntity } from '../../common/entities';
import { HeaderAuth, IReq, IUser } from '../../common/interfaces';
import {
  ConferenceHistoryRepository,
  ConferenceMeetingRepository,
  ConferenceRepository
} from '../../common/repositories';
import { getUtcSecond } from '../../common/utils/date.util';
import { ApiLastModifiedQueueService } from '../bullmq-queue';
import {
  EventNames, MeetingReplyEvent, MeetingSendEvent
} from '../communication/events';
import { MeetingEvent } from '../communication/events/meeting.event';
import {
  InviteSilentPushDTO,
  ReplySilentPushDTO
} from './dtos';

@Injectable()
export class ConferenceInviteRealtimeService {
  constructor(
    private readonly confHisRepo: ConferenceHistoryRepository,
    private readonly conferenceRepo: ConferenceRepository,
    private readonly confMeeting: ConferenceMeetingRepository,
    @InjectRepository(ChimeChatChannelEntity)
    private readonly chimeChannelRepo: Repository<ChimeChatChannelEntity>,
    private readonly eventEmitter: EventEmitter2,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService,
  ) {
  }

  async sendInvite(data: InviteSilentPushDTO, { user, headers }: IReq) {
    const { invitee } = data;
    if (!invitee?.length) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_DATA,
        message: MSG_DATA_INVALID,
        attributes: data
      });
    }
    // 0. check exist channel
    if (data.channel_id) {
      const channelExisted = await this.conferenceRepo
        .checkExistChannelByMember(data.channel_id, user.id);
      if (!channelExisted) {
        throw new BadRequestException({
          code: ErrorCode.CONFERENCE_NOT_EXIST,
          message: MSG_INVALID_CHANNEL_ID,
          attributes: data
        });
      }
    }

    const inviteeEmails = invitee
      //
      .map(({ email }) => email)
      // prevent push APNs to organizer and me
      .filter(email => email !== data.organizer);

    const { sendTo, ignoreTo } = await this.prepareParticipantsToSendEvent(data,
      headers, user, inviteeEmails);

    const emails = [
      ...sendTo,
      ...inviteeEmails
        .filter(email => !ignoreTo.includes(email))
    ];

    if (data.channel_id) {
      const chimeChannel = await this.chimeChannelRepo.findOne({
        select:['channel_arn'],
        where: {
          internal_channel_id: data.channel_id,
          internal_channel_type: CHAT_CHANNEL_TYPE.CONFERENCE,
        }
      });
      data.channel_arn = chimeChannel?.channel_arn;
    }
    // add sender for send-invite
    data.sender = user.email;
    // 0. send invite via realtime
    const rs = await this.eventEmitter
      .emitAsync(EventNames.SEND_MEETING_INVITE, {
        headers,
        sender: user.email,
        emails,
        data,
        dateItem: getUtcSecond()
      } as MeetingSendEvent);
    return {
      itemPass: invitee,
      itemFail: []
    };
  }

  private async prepareParticipantsToSendEvent(data: InviteSilentPushDTO,
    headers: HeaderAuth, user: IUser, inviteeEmails: string[]):
    Promise<{ sendTo: string[], ignoreTo: string[] }> {
    if (data.invite_status !== SEND_STATUS.invite_call) {
      return { sendTo: inviteeEmails, ignoreTo: [] };
    }
    // check meeting exists to trigger meeting start
    const { existed } = await this.checkExistMeetingToTriggerMeetingStart(data, headers);
    // Create default history for all member in channel with status = 24 - missing call
    const updatedDate = getUtcSecond();
    const { sendTo, ignoreTo } = await this.confHisRepo
      .createConferenceHistoryForInviteeV2(data.channel_id, user.id, data.call_type,
        data.organizer, inviteeEmails, data.meeting_id, data.external_meeting_id, updatedDate);

    if (sendTo.length > 0) {
      // send last modified to conference channel
      await this.apiLastModifiedQueueService.addJobConference({
        apiName: ApiLastModifiedName.CONFERENCE_HISTORY,
        channelId: data.channel_id,
        userId: user.id,
        updatedDate
      }, headers);
    }
    // send to all member in channel, except ignoreTo list
    return {
      sendTo,
      ignoreTo
    };
  }

  private async checkExistMeetingToTriggerMeetingStart(data: InviteSilentPushDTO,
    headers: HeaderAuth): Promise<{ existed: number }> {
    const meetingExisted = await this.confMeeting
      .checkMeetingExists(data.channel_id, data.meeting_id);
    if (meetingExisted) { return { existed: 1 }; }
    // get title from channel
    const channel = await this.conferenceRepo.findOne({
      select: ['title'],
      where: {
        id: data.channel_id
      }
    });
    // trigger event
    this.eventEmitter.emit(EventNames.START_MEETING, {
      headers,
      channelId: data.channel_id,
      channelTitle: channel.title,
      meetingId: data.meeting_id,
    } as MeetingEvent);
    return { existed: 0 };
  }

  async replyInvite(data: ReplySilentPushDTO, { user, headers }: IReq) {
    if (!data?.invitee) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_DATA,
        message: MSG_DATA_INVALID,
        attributes: data
      });
    }
    const { invitee } = data;
    if (!invitee?.length) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_DATA,
        message: MSG_DATA_INVALID,
        attributes: data
      });
    }
    if (data.channel_id) {
      const channelExisted = await this.conferenceRepo
        .checkExistChannelByMember(data.channel_id, user.id, true);
      if (!channelExisted) {
        throw new BadRequestException({
          code: ErrorCode.CONFERENCE_NOT_EXIST,
          message: MSG_INVALID_CHANNEL_ID,
          attributes: data
        });
      }
    }

    let inviteeEmails: string[] = [];

    if (data.reply_status === REPLY_SEND_STATUS.call_success
      || data.reply_status === REPLY_SEND_STATUS.call_declined) {
      inviteeEmails = invitee.concat([{ email: data.organizer }])
        .map(({ email }) => email);
    } else {
      inviteeEmails = invitee.filter(ivt => ivt.email !== user.email)
        .concat([{ email: data.organizer }])
        .map(({ email }) => email);
    }

    // 0. reply invite via realtime
    const rs = await this.eventEmitter
      .emitAsync(EventNames.REPLY_MEETING_INVITE, {
        headers,
        sender: user.email,
        emails: inviteeEmails,
        data,
        dateItem: getUtcSecond()
      } as MeetingReplyEvent);
    return {
      itemPass: inviteeEmails.map(email => ({ email })),
      itemFail: []
    };
  }
}