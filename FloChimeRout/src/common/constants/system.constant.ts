export enum CALL_STATUS {
  dial_out = 1,
  dial_in = 2,
  un_answer = 3,
  miss_calling = 4,
}
export enum CALL_TYPE {
  video_call = 1,
  audio_call = 2,
}

export enum SEND_STATUS {
  invite_call = 1,
  cancel_call = 2,
}

export enum CALLING {
  category = 'FLOWARE_VIDEO_CALL',
  priority = 'high',
  contentAvailable = 1,
  sound = 'default',
}

export enum ATTENDEE {
  limitUserMeeting = 10,
  limitUser = 100,
}

export enum CHANNEL {
  NONE_REVOKE = 0,
  NONE_CREATER = 0,
  CREATOR = 1,
  EXPIRE_TIME = 24,
  TOTAL_MEETING = 100
}

export enum CHIME_CHAT_CHANNEL_TYPE {
  conferencing = 1,
  shared_collection = 0,
}

export enum ChannelTypeNumber {
  SHARED_COLLECTION = 0,
  CONFERENCE = 1
}

export enum COLLECTION_TYPE {
  share = 3
}

export enum COLLECTION_SHARE_STATUS {
  WAITING = 0,
  JOINED = 1,
  DECLINED = 2,
  REMOVED = 3,    // remove by owner, un-share
  LEAVED = 4,      // leave share (member leave)
}

export enum COLLECTION_MEMBER_ACCESS {
  OWNER = 0,
  READ = 1,
  READ_WRITE = 2,
}

export enum SORT_TYPE {
  DESC = 'DESC',
  ASC = 'ASC',
}

export enum TRASH_STATUS {
  NOT_TRASH = 0,
  TRASHED = 1,
  DELETED = 2,
}

export enum REALTIME_STATUS {
  NOT_SEND = 0,
  SEND = 1,
}