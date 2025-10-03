/* eslint-disable prettier/prettier */
import { EmailDTO, HeaderAuth } from '.';

export enum Persistence {
  NONE_PERSISTENCE = 'NONE_PERSISTENCE',
  PERSISTENCE = 'PERSISTENCE', // save to DB for NOTIFICATION
}

export enum RType {
  NOTIFICATION = 'NOTIFICATION', // for notification
  EVENT = 'EVENT', // only for handle event
}

export enum RSendType {
  USER = 'USER',
  CHANNEL = 'CHANNEL',
  BROADCAST = 'BROADCAST',
}

export enum QoS {
  AT_MOST_ONCE = 0,
  AT_LEAST_ONCE = 1,
}

export enum RealTimeMessageCode {
  //
  API_LAST_MODIFIED = 'api_last_modified',
  //
  SHARED_COLLECTION_INVITE = 'shared_collection_invite',
  SHARED_COLLECTION_JOIN = 'shared_collection_join',
  SHARED_COLLECTION_DECLINE = 'shared_collection_decline',
  SHARED_COLLECTION_LEAVE = 'shared_collection_leave',
  SHARED_COLLECTION_REMOVE = 'shared_collection_remove',
  //

  CONFERENCE_MEETING_START = 'conference_meeting_start',
  CONFERENCE_MEETING_END = 'conference_meeting_end',

  CONFERENCE_MEETING_ATTENDEE_ADDED = 'conference_meeting_attendee_added',
  CONFERENCE_MEETING_ATTENDEE_REMOVED = 'conference_meeting_attendee_removed',
  CONFERENCE_MEETING_ATTENDEE_JOINED = 'conference_meeting_attendee_joined',
  CONFERENCE_MEETING_ATTENDEE_LEFT='conference_meeting_attendee_left',

  CONFERENCE_SEND_INVITE = 'conference_send_invite',
  CONFERENCE_CANCEL_INVITE = 'conference_cancel_invite',

  CONFERENCE_REPLY_INVITE_SUCCESS = 'conference_reply_invite_success',
  CONFERENCE_REPLY_INVITE_LEFT = 'conference_reply_invite_left',
  CONFERENCE_REPLY_INVITE_BUSY = 'conference_reply_invite_busy',
  CONFERENCE_REPLY_INVITE_DECLINE = 'conference_reply_invite_decline',
  CONFERENCE_REPLY_INVITE_NOT_ANSWER = 'conference_reply_invite_not_answer',
  CONFERENCE_REPLY_INVITE_CANCEL = 'conference_reply_invite_cancel',

  CONFERENCE_ADD_PARTICIPANT = 'conference_add_participant',
  CONFERENCE_REMOVE_PARTICIPANT = 'conference_remove_participant',
  CONFERENCE_DELETE_CHANNEL = 'conference_delete_channel',
  CONFERENCE_MEMBER_DELETE_CHANNEL = 'conference_member_delete_channel',
  
}
export enum SendOffline {
  no = 0,
  yes = 1,
}

export type RMessage = {
  event_type: RType;
  send_type: RSendType;
  message_code: RealTimeMessageCode;
  content: any;
  metadata: any;
  to: string[];
  delay: number;
  persistence: Persistence;
  qos?: QoS;
  send_offline?: SendOffline;

};

export interface IChatAttachment {
  name?: string;
  type?: string;
  size?: number;
  path?: string;
  url?: string;
  file_uid?: string;
}
export interface IChatMetadata {
  timestamp?: number;
  attachments?: IChatAttachment[];
  mentions?: IChatMention[];
  col_links?: IChatLink[];
  obj_links?: IChatLink[];
}

export interface IChatMention {
  email: string;
  mention_text?: string;
}

export interface IChatLink {
  id?: number;
}
export interface IChatMessage {
  external_message_uid?: string;
  content: string;
  channel: string;
  metadata: IChatMetadata;
}

export enum ChannelType {
  SHARED_COLLECTION = 'COLLECTION',
  CONFERENCE = 'CONFERENCE'
}
export interface RealTimeInterface {

  setHeader(headers: HeaderAuth);

  isEnableRealTime();

  createChannel(channelId: number, title: string, type: ChannelType, members?: EmailDTO[]);

  deleteChannel(channelId: number, type?: ChannelType);

  addMemberToChannel(channelId: number, members: EmailDTO[], type?: ChannelType);

  removeMemberFromChannel(channelId: number, members: EmailDTO[], type?: ChannelType);

  sendEventToChannel(channelId: number, messageCode: RealTimeMessageCode,
    content: any, metadata: any, type: ChannelType, persistence: Persistence);

  sendEventToIndividual(email: string, messageCode: RealTimeMessageCode,
    content: any, metadata: any, persistence: Persistence);

  sendNotificationToChannel(channelId: number, messageCode: RealTimeMessageCode,
    content: any, metadata: any, type: ChannelType, persistence: Persistence);

  sendSystemNotificationToIndividual(email: string | string[], messageCode: RealTimeMessageCode,
    content: any, metadata: any, persistence: Persistence);

  sendSystemEventToChannel(channelId: number, messageCode: RealTimeMessageCode,
    content: any, metadata: any, type: ChannelType, persistence: Persistence);

  sendSystemEventToIndividual(email: string, messageCode: RealTimeMessageCode,
    content: any, metadata: any, persistence: Persistence);

  sendSystemNotificationToChannel(channelId: number, messageCode: RealTimeMessageCode,
    content: any, metadata: any, type: ChannelType, persistence: Persistence);

}