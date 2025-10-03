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

// export interface MeetingSendEventMetadata extends RealTimeEventMetadata {}
// export interface MeetingReplyEventMetadata extends RealTimeEventMetadata {}

// export interface MeetingSendEvent extends RealTimeEvent {
//   sender: string;
//   emails: string[];
//   data: any;
//   dateItem: number;
// }

// export interface MeetingReplyEvent extends RealTimeEvent {
//   sender: string;
//   emails: string[];
//   data: any;
//   dateItem: number;
// }
