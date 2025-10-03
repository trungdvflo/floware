
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
    CHAT_USER_MISS = 'chat_user_miss',

    TODO_CREATED = 'todo_created',
    TODO_UPDATED = 'todo_updated',
    TODO_DELETED = 'todo_deleted',
    NOTE_CREATED = 'note_created',
    NOTE_UPDATED = 'note_updated',
    NOTE_DELETED = 'note_deleted',
    EVENT_CREATED = 'event_created',
    EVENT_UPDATED = 'event_updated',
    EVENT_DELETED = 'event_deleted',
  }

  export enum SendOffline {
    no = 0,
    yes = 1,
    both = 2
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
  }

  export interface IAttachment {
    name?: string;
    file_type?: string;
    size?: number;
    path?: string;
    signed_url?: string;
    file_common_id?: number;
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
  }

  export interface RealTimeEventMetadata {
    event_timestamp: number;
  }