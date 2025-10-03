export const FROM_SYSTEM = 'system';
export enum Persistence {
  NONE_PERSISTENCE = 'NONE_PERSISTENCE',
  PERSISTENCE = 'PERSISTENCE',
}

export enum Type {
  NOTIFICATION = 'NOTIFICATION',
  EVENT = 'EVENT',
  CHAT = 'CHAT',
}

export enum SendType {
  USER = 'USER',
  CHANNEL = 'CHANNEL',
  BROADCAST = 'BROADCAST',
}

export enum VoIP {
  no = 0,
  yes = 1,
}

export enum QoS {
  AT_MOST_ONCE = 0,
  AT_LEAST_ONCE = 1,
}

export enum Status {
  unsent = 0,
  sent = 1,
  read = 2,
  unread = 3,
}

export enum SendOffline {
  // only send to the clients connected to websocket
  no = 0,
  // send to the clients connected to websocket and push message to only the devices of user offline
  yes = 1,
  // send to the clients connected to websocket and push message to all the devices offline
  both = 2,
}

export enum APNS_CATEGORY {
  NOTIFICATION = 'FLOWARE_NOTIFICATION',
  VIDEO_CALL = 'FLOWARE_VIDEO_CALL',
}

export interface IMessageHeader {
  event_type: Type;
  send_type: SendType;
  from: string;
  to: string[];
  except_to?: string[];
  time: number;
  recovery?: boolean;
  isNeedAck?: boolean;
}

export interface IChatMarked {
  message_uid: string;
  content_marked: string;
}

export interface IMessagePayload {
  message_uid: string;
  message_code: string;
  event_timestamp?: number;
  content: any;
  metadata: any;
  channel?: string;
}

export interface IChatMessageAttachment {
  message_uid: string;
  file_id: number;
}
export interface IChatMessagePayloadMetadata {
  attachments?: IChatMessageAttachment[];
  chat_channel_id?: number;
  chat_channel_title?: string;
}

export interface IChatMessagePayload extends IMessagePayload {
  metadata: IChatMessagePayloadMetadata;

  parent_uid: string;
  content_marked: string;
  message_marked: {
    message_uid?: string,
    channel_id?: string,
    email?: string,
    content?: string,
    metadata?: any,
    sent_time?: number,
    created_date?: number,
    updated_date?: number,
  };
  channel_id: number;
  channel_type: ChannelTypeNumber;
  created_date: number;
  updated_date: number;
	deleted_date: number;
}

export interface IMessageSendOption {
  delay: number;
  qos?: number;
  send_offline: number;
  persistence: Persistence;
}
export interface IMessage {
  header: IMessageHeader;
  payload: IMessagePayload;
  option?: IMessageSendOption;
  isSendBroadCast?(): boolean;
  isSendChannel?(): boolean;
  isSendUser?(): boolean;
  isNotification?(): boolean;
  isEvent?(): boolean;
  isChat?(): boolean;
  isMessageChat?(): boolean;
  isPersistence?(): boolean;
  isSendAllDeviceOfUserOffline?(): boolean;
  isSendAllDevices?(): boolean;
  isSendAtLeastOnce?(): boolean;
  isVoIP?(): boolean;
  getAPNsCategory?(): APNS_CATEGORY;
  isNotSendSelf?(): boolean;
  isChatNotification?(): boolean;
  isNeedAck?(): boolean;
  set ignore_devices(devices: string[]);
  get ignore_devices(): string[];
  set ignore_device_tokens(tokens: string[]);
  get ignore_device_tokens(): string[];
}

export interface IMessageAPNs extends IMessage {
  payload: any;
}

export interface IChatMessage extends IMessage {
  payload: IChatMessagePayload;
}

export interface MessageFilter {
  channel: string;
  status?: number;
  to?: string;
  type: string;
  user?: string;
  email?: string;
  after_sent_time?: number;
  before_sent_time?: number;
  jump_message_uid?: string;
  order_by_sent_time?: string;
  parent_uid? : string;
}

export enum ChannelType {
  SHARED_COLLECTION = 'COLLECTION',
  CONFERENCE = 'CONFERENCE'
}

export enum ChannelTypeNumber {
  SHARED_COLLECTION = 0,
  CONFERENCE = 1
}

export enum MessageCode {
  CONFERENCE_MEETING_START = 'conference_meeting_start',
  CONFERENCE_MEETING_END = 'conference_meeting_end',
  CONFERENCE_MEETING_ATTENDEE_ADDED = 'conference_meeting_attendee_added',
  CONFERENCE_MEETING_ATTENDEE_REMOVED = 'conference_meeting_attendee_removed',
  CONFERENCE_MEETING_ATTENDEE_JOINED = 'conference_meeting_attendee_joined',
  CONFERENCE_MEETING_ATTENDEE_LEFT = 'conference_meeting_attendee_left',
  CHAT_USER_ONLINE = 'chat_user_online',
  CHAT_USER_OFFLINE = 'chat_user_offline',
  CHAT_USER_TYPING = 'chat_user_typing',
  CHAT_USER_END_TYPING = 'chat_user_end_typing',
  CHAT_USER_LAST_SEEN = 'chat_user_last_seen',
  CHAT_USER_CHANNEL_JOINED = 'chat_user_channel_left',
  CHAT_USER_CHANNEL_LEFT = 'chat_user_channel_joined',
  CHAT_USER_MESSAGE = 'chat_user_message',
  CHAT_NEW_MESSAGE = 'chat_new_message',
  CHAT_USER_MENTION = 'chat_user_mention',
  CHAT_USER_EDITED = 'chat_user_edited',
  CHAT_USER_DELETED = 'chat_user_deleted',

  API_LAST_MODIFIED = 'api_last_modified',

  SHARED_COLLECTION_INVITE = 'shared_collection_invite',
  SHARED_COLLECTION_JOIN = 'shared_collection_join',
  SHARED_COLLECTION_DECLINE = 'shared_collection_decline',
  SHARED_COLLECTION_LEAVE = 'shared_collection_leave',
  SHARED_COLLECTION_REMOVE = 'shared_collection_remove',

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
  TEST_MESSAGE = 'test_message',

  OWNER_TRASH_SHARED_COLLECTION = 'owner_trash_shared_collection',
  OWNER_RECOVER_SHARED_COLLECTION = 'owner_recover_shared_collection',
  OWNER_UPDATE_SHARED_COLLECTION = 'owner_update_shared_collection',
  SHARED_COLLECTION_CHANGE_MEMBER_ROLE = 'change_member_role',

  OBJECT_COMMENT_CREATE = 'object_comment_create',
  OBJECT_COMMENT_UPDATE = 'object_comment_update',
  OBJECT_COMMENT_DELETE = 'object_comment_delete',
  OBJECT_COMMENT_MENTION = 'object_comment_mention',

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
