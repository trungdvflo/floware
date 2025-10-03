import { EmailDTO } from '../../../common/dtos/email.dto';
import { HeaderAuth } from '../../../common/interfaces';
import { RealTimeEventMetadata } from '../events';

export enum Persistence {
  NONE_PERSISTENCE = 'NONE_PERSISTENCE',
  PERSISTENCE = 'PERSISTENCE' // save to DB for NOTIFICATION
}

export enum RType {
  NOTIFICATION = 'NOTIFICATION', // for notification
  EVENT = 'EVENT' // only for handle event
}

export enum RSendType {
  USER = 'USER',
  CHANNEL = 'CHANNEL',
  BROADCAST = 'BROADCAST'
}

export enum QoS {
  AT_MOST_ONCE = 0,
  AT_LEAST_ONCE = 1
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
  OWNER_TRASH_SHARED_COLLECTION = 'owner_trash_shared_collection',
  OWNER_RECOVER_SHARED_COLLECTION = 'owner_recover_shared_collection',
  OWNER_UPDATE_SHARED_COLLECTION = 'owner_update_shared_collection',
  SHARED_COLLECTION_CHANGE_MEMBER_ROLE = 'change_member_role',
  // Meeting
  CONFERENCE_MEETING_START = 'conference_meeting_start',
  // Comment
  OBJECT_COMMENT_CREATE = 'object_comment_create',
  OBJECT_COMMENT_UPDATE = 'object_comment_update',
  OBJECT_COMMENT_DELETE = 'object_comment_delete',
  OBJECT_COMMENT_MENTION = 'object_comment_mention',
  //
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
  CONFERENCE_REVOKE_PARTICIPANT = 'conference_revoke_participant',
  CONFERENCE_DELETE_CHANNEL = 'conference_delete_channel',
  CONFERENCE_MEMBER_DELETE_CHANNEL = 'conference_member_delete_channel',

  CHAT_USER_MENTION = 'chat_user_mention',

  TODO_CREATED = 'todo_created',
  TODO_UPDATED = 'todo_updated',
  TODO_DELETED = 'todo_deleted',
  TODO_TRASHED = 'todo_trashed',

  NOTE_CREATED = 'note_created',
  NOTE_UPDATED = 'note_updated',
  NOTE_DELETED = 'note_deleted',
  NOTE_TRASHED = 'note_trashed',

  EVENT_CREATED = 'event_created',
  EVENT_UPDATED = 'event_updated',
  EVENT_DELETED = 'event_deleted',
  EVENT_TRASHED = 'event_trashed',

  URL_CREATED = 'url_created',
  URL_UPDATED = 'url_updated',
  URL_DELETED = 'url_deleted',
  URL_TRASHED = 'url_trashed',
}

export enum SendOffline {
  // only send to the clients connected to websocket
  no = 0,
  // send to the clients connected to websocket and push message to only the devices of user offline
  yes = 1,
  // send to the clients connected to websocket and push message to all the devices offline
  both = 2,
}

export enum SETTING_NAME {
  CHAT_NOTIFICATION = 'chat_notification',
  CHAT_TYPING = 'chat_typing',
  CHAT_NOTIFICATION_HIDE_MESSAGE = 'chat_notification_hide_message',
}

export enum SETTING_ONOFF {
  ON = 'on',
  OFF = 'off',
}

export type RMessage = {
  event_type: RType;
  send_type: RSendType;
  message_code: RealTimeMessageCode;
  content: string;
  metadata: any;
  to: string[];
  delay: number;
  persistence: Persistence;
  qos?: QoS;
  send_offline?: SendOffline;
  ignore_device_tokens?: string[];
};

export enum ChannelType {
  SHARED_COLLECTION = 'COLLECTION',
  CONFERENCE = 'CONFERENCE'
}

export enum ChannelTypeNumber {
  SHARED_COLLECTION = 0,
  CONFERENCE = 1
}

export interface IPagination {
  page_no: number;
  page_size: number;
  before_time?: number;
  after_time?: number;
  sort?: string;
  after_sent_time?: number;
  before_sent_time?: number;
  order_by_sent_time?: string;
}

export interface IChatAttachment {
  name?: string;
  type?: string;
  size?: number;
  path?: string;
  url?: string;
  file_uid?: string;
}

export interface IChatMention {
  email: string;
  mention_text?: string;
}

export interface IChatLink {
  id?: number;
}

export interface IChatMetadata {
  timestamp?: number;
  attachments?: IChatAttachment[];
  mentions?: IChatMention[];
  col_links?: IChatLink[];
  obj_links?: IChatLink[];
}
export interface IChatMessage {
  external_message_uid?: string;
  content: string;
  channel: string;
  metadata: IChatMetadata;
  parent_uid?: string;
  marked: IChatMarked;
}

export interface IChatMessagePut {
  message_uid?: string;
  external_message_uid?: string;
  content: string;
  metadata: IChatMetadata;
}

export interface IChatSettingPut {
  name: SETTING_NAME;
  value: SETTING_ONOFF;
}

export interface IMessagePayload {
  to: string[];
  eventType: RType;
  sendType: RSendType;
  message_code: RealTimeMessageCode;
  content: string;
  metadata: RealTimeEventMetadata;
  persistence: Persistence;
  send_offline: SendOffline;
  delay: number;
  qos: number;
  ignore_device_tokens: string[];
}

export interface IChatMarked {
  message_uid: string;
  content_marked: string;
}

export interface RealTimeInterface {
  setHeader(headers: HeaderAuth);

  getStatistics();

  getReady();

  getWsAccessToken();

  createChannel(channelId: number, title: string, type: ChannelType, members?: EmailDTO[]);

  deleteChannel(channelId: number, type?: ChannelType);

  addMemberToChannel(channelId: number, members: EmailDTO[], type?: ChannelType);

  removeMemberFromChannel(channelId: number, members: EmailDTO[], type?: ChannelType);

  sendEventToChannel(
    channelId: number,
    messageCode: RealTimeMessageCode,
    content: string,
    metadata: any,
    type: ChannelType,
    persistence: Persistence,
  );

  sendEventToIndividual(
    email: string,
    messageCode: RealTimeMessageCode,
    content: string,
    metadata: any,
    persistence: Persistence,
  );

  sendNotificationToChannel(
    channelId: number,
    messageCode: RealTimeMessageCode,
    content: string,
    metadata: any,
    type: ChannelType,
    persistence: Persistence,
  );

  sendSystemNotificationToIndividual(
    email: string | string[],
    messageCode: RealTimeMessageCode,
    content: string,
    metadata: any,
    persistence: Persistence,
  );

  sendSystemEventToChannel(
    channelId: number,
    messageCode: RealTimeMessageCode,
    content: string,
    metadata: any,
    type: ChannelType,
    persistence: Persistence,
  );

  sendSystemEventToIndividual(
    email: string,
    messageCode: RealTimeMessageCode,
    content: string,
    metadata: any,
    persistence: Persistence,
  );

  sendSystemNotificationToChannel(
    channelId: number,
    messageCode: RealTimeMessageCode,
    content: string,
    metadata: any,
    type: ChannelType,
    persistence: Persistence,
  );

  sendChatMessage(
    channelId: number,
    type: ChannelType,
    metadata: IChatMetadata,
    content: string,
    external_message_uid: string,
  );

  getChannelChatMessage(
    channelId: number,
    parent_uid: string,
    type: ChannelType,
    paging: IPagination,
  );

  getListChatAttachments(channelId: number, type: ChannelType);

  updateChatMessage(message_uid: string, content: string, metadata: IChatMetadata);

  updateLastChatSeen(channelId: number, type: ChannelType, message_uid: string);

  deleteChatMessage(message_uid: string);
}