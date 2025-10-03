export enum ApiLastModifiedName {
  USER = 'user',
  SETTING = 'setting',
  THIRD_PARTY_ACCOUNT = 'third_party_account',
  COLLECTION = 'collection',
  KANBAN = 'kanban',
  FILE = 'file',
  KANBAN_CARD = 'kanban_card',
  KANBAN_CARD_MEMBER = 'kanban_card_member',
  CLOUD = 'cloud',
  PLATFORM_SETTING = 'platform_setting',
  URL = 'url',
  URL_MEMBER = 'url_member',
  RECENT_OBJECT = 'recent_object',
  CONTACT_HISTORY = 'contact_history',
  SORT_OBJECT = 'sort_object',
  LINKED_OBJECT = 'linked_object',
  LINKED_COLLECTION_OBJECT = 'linked_collection_object',
  LINKED_COLLECTION_OBJECT_MEMBER = 'linked_collection_object_member',
  EMAIL_TRACKING = 'email_tracking',
  TRASH = 'trash',
  CONTACT = 'contact',
  METADATA_EMAIL = 'metadata_email',
  TODO = 'todo',
  SHARE_MEMBER = 'share_member',
  COLLECTION_MEMBER = 'collection_member',
  SYSTEM_COLLECTION = 'system_collection',
  MANUAL_RULE = 'manual_rule',
  COLLECTION_INSTANCE_MEMBER = 'collection_instance_member',
  SUGGESTED_COLLECTION = 'suggested_collection',
  FILE_MEMBER = 'file_member',
  SUBSCRIPTION = 'subscription',
  CONFERENCING = 'conferencing',
  CONFERENCE_MEMBER = 'conference_member',
  CONFERENCE_HISTORY = 'conference_history',
  COLLECTION_ICONS = 'collection_icons',
  COLLECTION_COMMENT = 'collection_comment',
  COLLECTION_HISTORY = 'collection_history',
  COLLECTION_ACTIVITY = 'collection_activity'
}
export const API_LAST_MODIFIED_NAMES = Object.values(ApiLastModifiedName) as string[];

export enum DELETED_ITEM_LAST_MODIFIED_TYPE {
  FOLDER = 'collection'      // colections
  , HISTORY = 'contact_history'
  , KANBAN = 'kanban'
  , SORT_OBJECT = 'sort_object'
  , TRASH = 'trash'
  , URL = 'url'
  , VTODO = 'vtodo'
  , VJOURNAL = 'note'
  , ADDRESS_BOOK = 'addressbook'
  , CALENDAR = 'calendar'
  , VEVENT = 'vevent'
  , EVENT = 'event'
}

export enum TRASH_TYPE {
  EMAIL = 'EMAIL'
  , CSFILE = 'CSFILE'
  , FOLDER = 'FOLDER'
  , URL = 'URL'
  , VCARD = 'VCARD'
  , VEVENT = 'VEVENT'
  , VJOURNAL = 'VJOURNAL'
  , VTODO = 'VTODO'
  , SYSTEM_COLLECTION = 'SYSTEM_COLLECTION'
}

export const defaultJobOptions = {
  removeOnComplete: 1000, // discard this queue data when it reaches 1000 records
  removeOnFail: 5000,
  stackTraceLimit: 30
};

export enum DELETED_ITEM_TYPE {
  CANVAS = 'CANVAS'
  , CSFILE = 'CSFILE'
  , FILE = 'FILE'
  , FILE_MEMBER = 'FILE_MEMBER'
  , FOLDER = 'FOLDER'      // colections
  , FOLDER_MEMBER = 'FOLDER_MEMBER'      // shared colections
  , HISTORY = 'HISTORY'
  , KANBAN = 'KANBAN'
  , LINK = 'LINK'
  , COLLECTION_LINK = 'COLLECTION_LINK'
  , COLLECTION_LINK_MEMBER = 'COLLECTION_LINK_MEMBER'
  , ORDER_OBJ = 'ORDER_OBJ'
  , SET_3RD_ACC = 'SET_3RD_ACC'
  , SUGGESTED_COLLECTIONTRACK = 'SUGGESTED_COLLECTIONTRACK'
  , TRASH = 'TRASH'
  , URL = 'URL'
  , VCARD = 'VCARD'
  , VCARD_AVATAR = 'VCARD_AVATAR'
  , VEVENT = 'VEVENT'
  , VJOURNAL = 'VJOURNAL'
  , VTODO = 'VTODO'
  , TRACK = 'TRACK'
  , METADATA_EMAIL = 'METADATA_EMAIL'
  , NOTE = 'NOTE'
  , CALENDAR = 'CALENDAR'
  , CALENDAR_INSTANCE = 'CALENDAR_INSTANCE'
  , ADDRESS_BOOK = 'ADDRESS_BOOK'
  , RECENT_OBJ = 'RECENT_OBJ'
  , VIDEO_CALL = 'VIDEO_CALL'
  , MEMBER = 'SHARE_MEMBER'
  , SYSTEM_COLLECTION = 'SYSTEM_COLLECTION'
  , MANUAL_RULE = 'MANUAL_RULE'
  , COLLECTION_INSTANCE_MEMBER = 'COLLECTION_INSTANCE_MEMBER'
  , SUGGESTED_COLLECTION = 'SUGGESTED_COLLECTION'
  , CONFERENCING = 'CONFERENCING'
  , CONFERENCE_MEMBER = 'CONFERENCE_MEMBER'
  , CONFERENCE_HISTORY = 'CONFERENCE_HISTORY'
  , COLLECTION_COMMENT = 'COLLECTION_COMMENT'
  , COLLECTION_HISTORY = 'COLLECTION_HISTORY'
}

export enum OBJ_TYPE {
  VJOURNAL = 'VJOURNAL',
  VTODO = 'VTODO',
  VEVENT = 'VEVENT',
  VCARD = 'VCARD',
  URL = 'URL',
  EMAIL = 'EMAIL',
  GMAIL = 'GMAIL',
  EMAIL365 = 'EMAIL365',
  FOLDER = 'FOLDER',
  FILE = 'FILE',
  KANBAN = 'KANBAN',
  CANVAS = 'CANVAS',
  CSFILE = 'CSFILE',
  CONFERENCING = 'CONFERENCING'
}

export type GENERAL_OBJ = OBJ_TYPE.VTODO | OBJ_TYPE.VEVENT |
  OBJ_TYPE.VJOURNAL | OBJ_TYPE.VCARD | OBJ_TYPE.URL | OBJ_TYPE.CSFILE | OBJ_TYPE.CONFERENCING;

export type LINK_OBJ_TYPE = GENERAL_OBJ | OBJ_TYPE.EMAIL | OBJ_TYPE.GMAIL | OBJ_TYPE.EMAIL365;

export enum UPLOAD_STATUS {
  notUpload = 0,
  inProgress = 1,
  successed = 2,
  failed = 3
}

export enum RELEASE_STATUS {
  notStarted = '0',
  inProgress = '1',
  published = '2',
  declined = '3'
}

export const APP_IDS = {
  web: 'e70f1b125cbad944424393cf309efaf0',
  mac: 'ad944424393cf309efaf0e70f1b125cb',
  iphone: 'faf0e70f1bad944424393cf309e125cb',
  ipad: 'd944424393cf309e125cbfaf0e70f1ba',
  sabreDav: '323d0aa8b591b15d68360faf4c853641',
  macInternal: 'fd99981046681b6bbc2124c72e569591',
};

export const AWS_S3_DOWNLOAD_EXPIRE_TIME_DEFAULT = 900; // 15 minutes

export const JWT_SECRET_KEY = 'er9MRwLmDQ7PH';

export enum SOURCE_TYPE_FILE_COMMON {
  COMMENT = 'COMMENT',
}

export enum SHARE_STATUS {
  WAITING = 0,
  JOINED = 1,
  DECLINED = 2,
  REMOVED = 3,    // remove by owner, un-share
  LEAVED = 4      // leave share (member leave)
}

export const FILE_MOD = [0, 1];