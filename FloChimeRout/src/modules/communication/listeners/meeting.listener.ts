/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ADD_ATTENDEE_TO_MEETING,
  END_MEETING,
  END_MEETING_FROM_API,
  JOIN_ATTENDEE_TO_MEETING,
  LEAVE_ATTENDEE_FROM_MEETING,
  REMOVE_ATTENDEE_FROM_MEETING,
  START_MEETING
} from '../events';
import { MeetingAttendeeEvent, MeetingEvent, MeetingEventMetadata } from '../events/meeting.event';
import { ChannelType, RealTimeMessageCode } from '../interfaces';
import { RealTimeService } from '../services';

@Injectable()
export class MeetingListener {
  constructor(private readonly realTimeService: RealTimeService) { }

  // send event meeting start to real-time
  @OnEvent(START_MEETING)
  async handleStartMeeting({ headers, channelId, channelTitle, meetingId }:
    MeetingEvent) {
    const content = channelTitle ? `Call ${channelTitle} is started` : `Meeting ${meetingId} is started`;
    await this.realTimeService.setHeader(headers)
      .sendEventToChannel(channelId, RealTimeMessageCode.CONFERENCE_MEETING_START,
        content,
        {
          conference: {
            channel_id: channelId,
            channel_title: channelTitle
          },
          meeting: {
            meetingId: meetingId
          },
          event_timestamp: Date.now() / 1e3,
        } as MeetingEventMetadata,
        ChannelType.CONFERENCE);
  }

  // send message end meeting event to real-time
  @OnEvent(END_MEETING)
  async handleEndMeeting({ channelId, channelTitle, meetingId }:
    MeetingEvent) {
    const content = channelTitle ? `Call ${channelTitle} is ended` : `Meeting ${meetingId} is ended`;
    await this.realTimeService
      .sendSystemEventToChannel(channelId,
        RealTimeMessageCode.CONFERENCE_MEETING_END,
        content,
        {
          conference: {
            channel_id: channelId,
            channel_title: channelTitle
          },
          meeting: {
            meetingId: meetingId
          },
          event_timestamp: Date.now() / 1e3,
        } as MeetingEventMetadata,
        ChannelType.CONFERENCE);
  }


  // send message end meeting event to real-time
  @OnEvent(END_MEETING_FROM_API)
  async handleEndMeetingFromAPI({ headers, channelId, channelTitle, meetingId }:
    MeetingEvent) {
    const content = channelTitle ? `Call ${channelTitle} is ended` : `Meeting ${meetingId} is ended`;
    await this.realTimeService
      .setHeader(headers)
      .sendEventToChannel(channelId,
        RealTimeMessageCode.CONFERENCE_MEETING_END,
        content,
        {
          conference: {
            channel_id: channelId,
            channel_title: channelTitle
          },
          meeting: {
            meetingId: meetingId
          },
          event_timestamp: Date.now() / 1e3,
        } as MeetingEventMetadata,
        ChannelType.CONFERENCE);
  }

  @OnEvent(ADD_ATTENDEE_TO_MEETING)
  async handleAddAttendeeMeeting({ channelId,
    channelTitle, meetingId, attendeeId, attendeeEmail }:
    MeetingAttendeeEvent) {
    await this.realTimeService
      .sendSystemEventToChannel(channelId,
        RealTimeMessageCode.CONFERENCE_MEETING_ATTENDEE_ADDED,
        `${attendeeEmail} added to ${channelTitle} call`,
        {
          conference: {
            channel_id: channelId,
            channel_title: channelTitle
          },
          meeting: {
            meetingId,
            attendeeId
          },
          event_timestamp: Date.now() / 1e3,
        } as MeetingEventMetadata,
        ChannelType.CONFERENCE);
  }

  @OnEvent(REMOVE_ATTENDEE_FROM_MEETING)
  async handleRemoveAttendee({ channelId, channelTitle,
    meetingId, attendeeId, attendeeEmail }:
    MeetingAttendeeEvent) {
    await this.realTimeService
      .sendSystemEventToChannel(channelId,
        RealTimeMessageCode.CONFERENCE_MEETING_ATTENDEE_REMOVED,
        `${attendeeEmail} removed from ${channelTitle} call`,
        {
          conference: {
            channel_id: channelId,
            channel_title: channelTitle
          },
          meeting: {
            meetingId,
            attendeeId
          },
          event_timestamp: Date.now() / 1e3,
        } as MeetingEventMetadata,
        ChannelType.CONFERENCE);
  }
  // 
  @OnEvent(JOIN_ATTENDEE_TO_MEETING)
  async handeAttendeeJoin({channelId, channelTitle,
    meetingId, attendeeId, attendeeEmail
  }:
    MeetingAttendeeEvent) {
    await this.realTimeService
      .sendSystemEventToChannel(channelId,
        RealTimeMessageCode.CONFERENCE_MEETING_ATTENDEE_JOINED,
        `${attendeeEmail} have joined to ${channelTitle} call`,
        {
          conference: {
            channel_id: channelId,
            channel_title: channelTitle
          },
          meeting: {
            meetingId,
            attendeeId
          },
          event_timestamp: Date.now() / 1e3,
        } as MeetingEventMetadata,
        ChannelType.CONFERENCE);
  }
  // 
  @OnEvent(LEAVE_ATTENDEE_FROM_MEETING)
  async handleRemoveAddtendee({ channelId, channelTitle,
    meetingId, attendeeId, attendeeEmail
  }:
    MeetingAttendeeEvent) {
    await this.realTimeService
      .sendSystemEventToChannel(channelId,
        RealTimeMessageCode.CONFERENCE_MEETING_ATTENDEE_LEFT,
        `${attendeeEmail} have leaved from the ${channelTitle} call`,
        {
          conference: {
            channel_id: channelId,
            channel_title: channelTitle
          },
          meeting: {
            meetingId,
            attendeeId
          },
          event_timestamp: Date.now() / 1e3,
        } as MeetingEventMetadata,
        ChannelType.CONFERENCE);
  }
}