import { RealTimeEvent, RealTimeEventMetadata } from './real-time.event';

export interface MeetingEvent extends RealTimeEvent {
  content: string;
  channelId: number;
  channelTitle: string;
  meetingId: string;
}

export interface MeetingAttendeeEvent extends MeetingEvent {
  attendeeId: string;
  attendeeEmail: string;
}
export interface MeetingEventMetadata extends RealTimeEventMetadata {
  conference: any;
  meeting: any;
}