/* eslint-disable prettier/prettier */
import {
  Controller
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SqsMessageHandler } from '@ssut/nestjs-sqs';
import { SQS_CHIME_MEETING_EVENT_NAME } from 'common/constants/environment.constant';
import { TimestampDouble } from 'common/utils/datetime.util';
import { MeetingStatus } from 'entities/meeting.entity';
import { ActivitiesType } from 'entities/meeting_activities.entity';
import { JoinStatus } from 'entities/meeting_attendee.entity';
import { ADD_ATTENDEE_TO_MEETING, END_MEETING, JOIN_ATTENDEE_TO_MEETING, LEAVE_ATTENDEE_FROM_MEETING, REMOVE_ATTENDEE_FROM_MEETING } from 'modules/communication/events';
import { MeetingAttendeeEvent, MeetingEvent } from 'modules/communication/events/meeting.event';
import { MeetingService } from 'modules/meeting/meeting.service';
import { MeetingEventService } from './meeting-event.service';

interface IEventMeeting {
  eventType: string,
  timestamp: number,
  meetingId: string,
  externalMeetingId: string,
  mediaRegion: string
}

interface IEventMeetingAttendee {
  eventType: string,
  timestamp: number,
  meetingId: string,
  attendeeId: string,
  externalUserId: string,
  externalMeetingId: string,
  mediaRegion: string
}

@Controller()
export class MeetingEventController {
  private endMettingTaskTimeout = {};
  constructor(
    private readonly meetingEventService: MeetingEventService,
    private readonly meetingService: MeetingService,
    private readonly eventEmitter: EventEmitter2
  ) { }

  @SqsMessageHandler(process.env.SQS_CHIME_MEETING_EVENT_NAME || SQS_CHIME_MEETING_EVENT_NAME, false)
  async handler(message: AWS.SQS.Message) {
    try {
      const obj: any = JSON.parse(message.Body) as {
        message: string;
        date: string;
      };

      const data = JSON.parse(obj.Message);
      if (data?.InvocationEventType) {
        data.timestamp = new Date(obj.Timestamp).getTime() / 1000
        return await this.handleCallPhoneEvent(data)
      }

      return await this.handleMeetingEvent(data)
    } catch (error) {
      console.error(error)
    }
  }

  async handleMeetingEvent(eventData: any) {
    const eventDetail = eventData?.detail
    const eventType = eventDetail?.eventType
    console.log(eventData)
    switch (eventType) {
      case 'chime:MeetingStarted':
        await this.meetingStarted(eventDetail)
        break
      case 'chime:MeetingEnded':
        await this.meetingEnded(eventDetail)
        break
      case 'chime:AttendeeAdded':
        //await this.attendeeAdded(eventDetail)
        break
      case 'chime:AttendeeLeft':
        await this.attendeeLeft(eventDetail)
        break
      case 'chime:AttendeeJoined':
        await this.attendeeJoined(eventDetail)
        break
      case 'chime:AttendeeAuthorized':
        await this.attendeeAuthorized(eventDetail)
        break
      case 'chime:AttendeeDeleted':
        // await this.attendeeDeleted(eventDetail)
        break
      case 'chime:AttendeeDropped':
        await this.attendeeDropped(eventDetail)
        break
      case 'chime:AttendeeVideoStarted':
        await this.attendeeContentVideoStarted(eventDetail)
        break
      case 'chime:AttendeeVideoStopped':
        await this.attendeeVideoStopped(eventDetail)
        break
      case 'chime:AttendeeContentLeft':
        await this.attendeeContentLeft(eventDetail)
        break
      case 'chime:AttendeeContentJoined':
        await this.attendeeContentJoined(eventDetail)
        break
      case 'chime:AttendeeContentDropped':
        await this.attendeeContentDropped(eventDetail)
        break
      case 'chime:AttendeeContentVideoStarted':
        await this.attendeeContentVideoStarted(eventDetail)
        break
      case 'chime:AttendeeContentVideoStopped':
        await this.attendeeContentVideoStopped(eventDetail)
        break
      default:
        console.log('unknow event')
    }
  }
  async meetingStarted(event: IEventMeeting) {
    console.log(event)
    // send realtime meeting start
    // const { title = '', channel_id = '' } = await this.confMemberRepo.getConferenceByMeetingId(event.meetingId);

    // this.eventEmitter.emit(START_MEETING, {
    //   content: `Meeting ${event.meetingId} is started`,
    //   channelId: channel_id,
    //   channelTitle: title,
    //   meetingId: event.meetingId,
    // } as MeetingEvent);
  }

  async meetingEnded(event: IEventMeeting) {
    // send real-time event
    // check end?
    const { channel_title = '', channel_id = '', status } = await this.meetingEventService.getMeeting(event.meetingId);
    if (channel_id && status != MeetingStatus.ENDED) {
      this.eventEmitter.emit(END_MEETING, {
        channelId: channel_id,
        channelTitle: channel_title,
        meetingId: event.meetingId,
      } as MeetingEvent);
    }
    await this.meetingEventService.updateStatusEndMeeting(event.meetingId, event.timestamp / 1000);
    await this.meetingEventService.cleanUpData(event.meetingId);
  }

  async handleCallPhoneEvent(eventData: any) {
    console.log(eventData)
    if (eventData?.InvocationEventType != 'HANGUP'
      && eventData?.InvocationEventType != 'ACTION_SUCCESSFUL') {
      return;
    }
    const meeetingId = eventData?.CallDetails?.TransactionAttributes?.MeetingId;
    const phoneNumber = eventData?.CallDetails?.TransactionAttributes?.RequestedDialNumber;
    const participantTag = eventData?.ActionData?.Parameters?.ParticipantTag;
    if (participantTag == 'LEG-A') {
      return;
    }

    if (!meeetingId || !phoneNumber) {
      return;
    }
    const timestamp = eventData?.timestamp
    const eventType = eventData?.InvocationEventType == 'HANGUP' ? ActivitiesType.LEAVED : ActivitiesType.JOINED
    const param = {
      meeting_id: meeetingId,
      attendee_id: null,
      activity_time: timestamp,
      phone_number: phoneNumber,
      type: eventType
    }
    await this.meetingEventService.saveMeetingActivities(param)
    if (eventType == ActivitiesType.LEAVED) {
      await this.meetingEventService.updateMeetingAttendeeSpendTime(meeetingId, timestamp, null, phoneNumber)
    } else {
      await this.meetingEventService.updateMeetingAttendeeStatus(param)
      const spendTime = TimestampDouble() - timestamp
      const limitTime = process.env?.TIME_LIMIT_PHONE_CALL_ON_MEETING ? parseInt(process.env?.TIME_LIMIT_PHONE_CALL_ON_MEETING) : 60;
      const remainTime = (limitTime - spendTime) * 1000
      if (remainTime > 0) {
        setTimeout(async ()=> {
          const atteendee = await this.meetingEventService.getMeetingAttendeeByPhone(meeetingId, phoneNumber)
          if (atteendee.status == JoinStatus.JOINED) {
            const attendeeParams = {
              MeetingId: meeetingId,
              AttendeeId: atteendee.attendee_id
            }
            this.meetingService.deleteAttendee(attendeeParams)
            await this.meetingEventService.updateMeetingAttendeeSpendTimeByDrop(meeetingId, (Date.now() / 1000), null, phoneNumber)
          }
        }, remainTime)
      }

    }
  }

  async attendeeAdded(event: IEventMeetingAttendee) {
    // send real-time event// update status attendeeAdded to database
    const { channel_title, channel_id } = await this.meetingEventService.getMeeting(event.meetingId);
    if (!channel_id) {
      return;
    }
    this.eventEmitter.emit(ADD_ATTENDEE_TO_MEETING, {
      channelId: channel_id,
      channelTitle: channel_title,
      meetingId: event.meetingId,
      attendeeId: event.attendeeId,
      attendeeEmail: event.externalUserId
    } as MeetingAttendeeEvent);
  }
  async attendeeDeleted(event: IEventMeetingAttendee) {
    // update status attendeeAdded to database
    // send real-time event
    const { channel_title, channel_id } = await this.meetingEventService.getMeeting(event.meetingId);
    if (!channel_id) {
      return;
    }
    this.eventEmitter.emit(REMOVE_ATTENDEE_FROM_MEETING, {
      channelId: channel_id,
      channelTitle: channel_title,
      meetingId: event.meetingId,
      attendeeId: event.attendeeId,
      attendeeEmail: event.externalUserId
    } as MeetingAttendeeEvent);
  }

  async attendeeLeft(event: IEventMeetingAttendee) {
    const param = {
      meeting_id: event.meetingId,
      attendee_id: event.attendeeId,
      activity_time: event.timestamp / 1000,
      phone_number: null,
      type: ActivitiesType.LEAVED
    }
    await this.meetingEventService.saveMeetingActivities(param)
    await this.meetingEventService.updateMeetingAttendeeSpendTime(event.meetingId, param.activity_time, event.attendeeId, null)
    // handle auto end meeting
    const atteendeeCount = await this.meetingEventService.decreaseMeetingAttendee(event.meetingId);
    if (atteendeeCount <= 1) {
      await this.meetingEventService.handleAutoEndMeeting(event.meetingId, atteendeeCount);
    }
    // send real-time event
    const { channel_title, channel_id } = await this.meetingEventService.getMeeting(event.meetingId);
    if (!channel_id) {
      return;
    }
    this.eventEmitter.emit(LEAVE_ATTENDEE_FROM_MEETING, {
      channelId: channel_id,
      channelTitle: channel_title,
      meetingId: event.meetingId,
      attendeeId: event.attendeeId,
      attendeeEmail: event.externalUserId
    } as MeetingAttendeeEvent);
  }

  async attendeeDropped(event: IEventMeetingAttendee) {
    const param = {
      meeting_id: event.meetingId,
      attendee_id: event.attendeeId,
      activity_time: event.timestamp / 1000,
      phone_number: null,
      type: ActivitiesType.LEAVED
    }
    await this.meetingEventService.saveMeetingActivities(param)
    await this.meetingEventService.updateMeetingAttendeeSpendTime(event.meetingId, param.activity_time, event.attendeeId, null)

    // handle auto end meeting
    const atteendeeCount = await this.meetingEventService.decreaseMeetingAttendee(event.meetingId);
    if (atteendeeCount <= 1) {
      await this.meetingEventService.handleAutoEndMeeting(event.meetingId, atteendeeCount);
    }

    // update status attendeeLeft to database
    const { channel_title, channel_id } = await this.meetingEventService.getMeeting(event.meetingId);
    if (!channel_id) {
      return;
    }
    this.eventEmitter.emit(REMOVE_ATTENDEE_FROM_MEETING, {
      channelId: channel_id,
      channelTitle: channel_title,
      meetingId: event.meetingId,
      attendeeId: event.attendeeId,
      attendeeEmail: event.externalUserId
    } as MeetingAttendeeEvent);
  }

  async attendeeAuthorized(event: IEventMeetingAttendee) {
    console.log(event)
    // The Amazon Chime SDK sends this event when an existing attendee joins a meeting.
    // update status verify jontoken success to database
  }
  async attendeeJoined(event: IEventMeetingAttendee) {
    const param = {
      meeting_id: event.meetingId,
      attendee_id: event.attendeeId,
      activity_time: event.timestamp / 1000,
      phone_number: null,
      type: ActivitiesType.JOINED
    }
    // clean end meeting task when a new attendee has joined
    if (this.endMettingTaskTimeout.hasOwnProperty(event.meetingId)) {
      clearTimeout(this.endMettingTaskTimeout[event.meetingId]);
    }
    // increase meeting attendee count in redis
    await this.meetingEventService.increaseMeetingAttendee(event.meetingId);
    await this.meetingEventService.saveMeetingActivities(param)
    await this.meetingEventService.updateMeetingAttendeeStatus(param)

    // send real-time event
    const { channel_title, channel_id } = await this.meetingEventService.getMeeting(event.meetingId);
    if (!channel_id) {
      return;
    }
    this.eventEmitter.emit(JOIN_ATTENDEE_TO_MEETING, {
      channelId: channel_id,
      channelTitle: channel_title,
      meetingId: event.meetingId,
      attendeeId: event.attendeeId,
      attendeeEmail: event.externalUserId
    } as MeetingAttendeeEvent);
  }

  async attendeeVideoStarted(event: IEventMeetingAttendee) {
    console.log(event)
    // console.log(event)
    // The Amazon Chime SDK sends this event when an existing attendee starts streaming video.
    // update status attend joined meeeting to database
  }

  async attendeeVideoStopped(event: IEventMeetingAttendee) {
    console.log(event)
    // console.log(event)
    // The Amazon Chime SDK sends this event when an existing attendee stops streaming video.
    // update status attend joined meeeting to database
  }

  async attendeeContentJoined(event: IEventMeetingAttendee) {
    console.log(event)
    // console.log(event)
    // The Amazon Chime SDK sends this event when an existing attendee starts sharing their screen.
    // update status attend joined meeeting to database
  }

  async attendeeContentLeft(event: IEventMeetingAttendee) {
    // this.logger.log(event)
    console.log(event)
    // The Amazon Chime SDK sends this event when a content share leaves an Amazon Chime SDK meeting using the specified network transport.
    // update status attend joined meeeting to database
  }

  async attendeeContentDropped(event: IEventMeetingAttendee) {
    // this.logger.log(event)
    console.log(event)
    // The Amazon Chime SDK sends this event when a content share drops from an Amazon Chime SDK meeting using the specified network transport.
    // update status attend joined meeeting to database
  }

  async attendeeContentVideoStarted(event: IEventMeetingAttendee) {
    // this.logger.log(event)
    console.log(event)
    // The Amazon Chime SDK sends this event when a content share starts streaming video.
    // update status attend joined meeeting to database
  }

  async attendeeContentVideoStopped(event: IEventMeetingAttendee) {
    // this.logger.log(event)
    // console.log(event)
    // The Amazon Chime SDK sends this event when a content share stops streaming video.
    // update status attend joined meeeting to database
  }
}
