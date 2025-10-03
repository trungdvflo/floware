import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { REPLY_SEND_STATUS, SEND_STATUS } from '../../../common/constants';
import {
  ConferenceEvent,
  ConferenceEventMetadata,
  EventNames,
  MeetingReplyEvent,
  MeetingReplyEventMetadata,
  MeetingSendEvent,
  MeetingSendEventMetadata,
} from '../events';
import { ChannelType, Persistence, RealTimeMessageCode, SendOffline } from '../interfaces';
import { RealTimeService } from '../services';
import { Listener } from './listener';

@Injectable()
export class ConferenceListener extends Listener {
  constructor(private readonly realTimeService: RealTimeService) {
    super();
  }

  @OnEvent(EventNames.ADD_MEMBER_TO_CONFERENCE)
  async handleAddMemberToConference({
    headers, confMembers, dateItem, type
  }: ConferenceEvent) {
    //
    confMembers.forEach(async member => {
      // add member
      await this.realTimeService.setHeader(headers)
        .addMemberToChannel(member.channel_id,
          [{ email: member.email }]
          , type
        );
      //
      const metadata: ConferenceEventMetadata = {
        member_id: member.id,
        email: member.email,
        channel_id: member.channel_id,
        event_timestamp: dateItem,
      };
      await this.realTimeService
        .sendEventToChannel(member.channel_id,
          RealTimeMessageCode.CONFERENCE_ADD_PARTICIPANT,
          this.getEventMessage(EventNames.ADD_MEMBER_TO_CONFERENCE, [member.email, member.title]),
          metadata, ChannelType.CONFERENCE);
    });
  }

  @OnEvent(EventNames.REVOKE_MEMBER_FROM_CONFERENCE)
  async handleRevokeMemberToConference({
    headers, confMembers, dateItem
  }: ConferenceEvent) {
    // use to send to individual effective member
    await Promise.all(confMembers.map(async member => {
      await this.realTimeService.setHeader(headers)
        .revokeMemberFromChannel(member.channel_id, [{ email: member.email }]
          , ChannelType.CONFERENCE
        );

      const metadata: ConferenceEventMetadata = {
        member_id: member.id,
        email: member.email,
        channel_id: member.channel_id,
        event_timestamp: dateItem,
      };

      await this.realTimeService
        .setHeader(headers)
        .sendEventToIndividual(
          member.email,
          RealTimeMessageCode.CONFERENCE_REVOKE_PARTICIPANT,
          this.getEventMessage(EventNames.REVOKE_MEMBER_FROM_CONFERENCE, ['You', member.title]),
          metadata,
        );
    }));

    // use to send to remaining members
    confMembers.forEach(async member => {
      const metadata: ConferenceEventMetadata = {
        member_id: member.id,
        email: member.email,
        channel_id: member.channel_id,
        event_timestamp: dateItem,
      };
      await this.realTimeService
        .setHeader(headers)
        .sendEventToChannel(member.channel_id,
          RealTimeMessageCode.CONFERENCE_REVOKE_PARTICIPANT,
          this.getEventMessage(EventNames.REVOKE_MEMBER_FROM_CONFERENCE,
            [member.email, member.share_title]),
          metadata, ChannelType.CONFERENCE);
    });
  }

  @OnEvent(EventNames.DELETE_CONFERENCE_CHANNEL)
  async handleMemberDeleteConference({
    headers, confMembers, dateItem
  }: ConferenceEvent) {
    //
    await this.realTimeService.setHeader(headers)
      .removeMemberFromChannel(confMembers[0].channel_id,
        confMembers.map(({ email }) => ({ email }))
        , ChannelType.CONFERENCE
      );
    //
    confMembers.forEach(async member => {
      if (member.revoke_time > 0) { return; }
      const metadata: ConferenceEventMetadata = {
        member_id: member.id,
        email: member.email,
        channel_id: member.channel_id,
        event_timestamp: dateItem,
      };
      await this.realTimeService
        .sendEventToChannel(member.channel_id,
          RealTimeMessageCode.CONFERENCE_MEMBER_DELETE_CHANNEL,
          this.getEventMessage(EventNames.DELETE_CONFERENCE_CHANNEL, [member.email, member.title]),
          metadata, ChannelType.CONFERENCE);
    });
  }

  @OnEvent(EventNames.SEND_MEETING_INVITE_OLD)
  async handleSendInviteOldway({ headers, emails, data, dateItem }: MeetingSendEvent) {
    const metadata: MeetingSendEventMetadata = {
      ...data,
      event_timestamp: dateItem,
    };
    // send to non channel user
    if (emails.length > 0) {
      await this.realTimeService
        .setHeader(headers)
        .sendNotificationToIndividual(emails,
          this.getInviteMessageCode(metadata.invite_status),
          this.getInviteMessage(metadata.invite_status),
          metadata,
          Persistence.NONE_PERSISTENCE,
          SendOffline.no
        );
    }
  }

  @OnEvent(EventNames.REPLY_MEETING_INVITE_OLD)
  async handleReplyInviteOldWay({ headers, sender, emails, data, dateItem }: MeetingReplyEvent) {
    const metadata: MeetingReplyEventMetadata = {
      ...data,
      event_timestamp: dateItem,
    };
    await this.realTimeService
      .setHeader(headers)
      .sendEventToIndividual(emails,
        this.getReplyMessageCode(metadata.reply_status),
        this.getReplyMessage(metadata.reply_status, sender),
        metadata,
        Persistence.NONE_PERSISTENCE,
        SendOffline.no);
  }

  @OnEvent(EventNames.SEND_MEETING_INVITE)
  async handleSendInvite({ headers, emails, data, dateItem }: MeetingSendEvent) {
    const metadata: MeetingSendEventMetadata = {
      ...data,
      event_timestamp: dateItem,
    };
    // if (data.channel_id) {
    //   // send throw realtime channel
    //   await this.realTimeService
    //     .setHeader(headers)
    //     .sendNotificationToChannel(data.channel_id,
    //       this.getInviteMessageCode(metadata.invite_status),
    //       this.getInviteMessage(metadata.invite_status),
    //       metadata,
    //       ChannelType.CONFERENCE,
    //       Persistence.NONE_PERSISTENCE,
    //       SendOffline.both
    //     );
    // }
    // send to flo user
    if (emails.length > 0) {
      await this.realTimeService
        .setHeader(headers)
        .sendNotificationToIndividual(emails,
          this.getInviteMessageCode(metadata.invite_status),
          this.getInviteMessage(metadata.invite_status),
          metadata,
          Persistence.NONE_PERSISTENCE,
          SendOffline.both
        );
    }
  }

  @OnEvent(EventNames.REPLY_MEETING_INVITE)
  async handleReplyInvite({ headers, sender, emails, data, dateItem }: MeetingReplyEvent) {
    const metadata: MeetingReplyEventMetadata = {
      ...data,
      event_timestamp: dateItem,
    };
    const qos = 0;
    const delay = 0;

    await this.realTimeService
      .setHeader(headers)
      .sendEventToIndividual(emails,
        this.getReplyMessageCode(metadata.reply_status),
        this.getReplyMessage(metadata.reply_status, sender),
        metadata,
        Persistence.NONE_PERSISTENCE,
        SendOffline.both,
        qos,
        delay,
        [data.device_token]
      );
  }

  getInviteMessageCode(code: number): RealTimeMessageCode {
    return {
      [SEND_STATUS.invite_call]: RealTimeMessageCode.CONFERENCE_SEND_INVITE,
      [SEND_STATUS.cancel_call]: RealTimeMessageCode.CONFERENCE_CANCEL_INVITE,
    }[code];
  }

  getReplyMessageCode(code: number): RealTimeMessageCode {
    return {
      [REPLY_SEND_STATUS.call_success]: RealTimeMessageCode.CONFERENCE_REPLY_INVITE_SUCCESS,
      [REPLY_SEND_STATUS.call_left]: RealTimeMessageCode.CONFERENCE_REPLY_INVITE_LEFT,
      [REPLY_SEND_STATUS.call_busy]: RealTimeMessageCode.CONFERENCE_REPLY_INVITE_BUSY,
      [REPLY_SEND_STATUS.call_declined]: RealTimeMessageCode.CONFERENCE_REPLY_INVITE_DECLINE,
      [REPLY_SEND_STATUS.call_not_answer]: RealTimeMessageCode.CONFERENCE_REPLY_INVITE_NOT_ANSWER,
      [REPLY_SEND_STATUS.call_cancel]: RealTimeMessageCode.CONFERENCE_REPLY_INVITE_CANCEL,
    }[code];
  }
}