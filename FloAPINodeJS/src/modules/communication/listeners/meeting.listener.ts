/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

import { MeetingEvent, MeetingEventMetadata } from '../events/meeting.event';
import { START_MEETING } from '../events/names';
import { ChannelType, RealTimeMessageCode } from '../interfaces';
import { RealTimeService } from '../services';

@Injectable()
export class MeetingListener {
  constructor(private readonly realTimeService: RealTimeService) { }

  // send event meeting start to real-time
  @OnEvent(START_MEETING)
  async handleStartMeeting({ headers, channelId, channelTitle, meetingId }:
    MeetingEvent) {
    const content = channelTitle
      ? `Call ${channelTitle} is started`
      : `Meeting ${meetingId} is started`;
    await this.realTimeService.setHeader(headers)
      .sendEventToChannel(channelId, RealTimeMessageCode.CONFERENCE_MEETING_START,
        content,
        {
          conference: {
            channel_id: channelId,
            channel_title: channelTitle
          },
          meeting: {
            meetingId
          },
          event_timestamp: Date.now() / 1e3,
        } as MeetingEventMetadata,
        ChannelType.CONFERENCE);
  }
}