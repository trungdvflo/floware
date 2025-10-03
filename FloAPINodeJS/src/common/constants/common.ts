
export const CONFIGS = {
  MIGRATE_GROUP: 'migrate',
  FLM_DOWNLOAD_KEY: 'FLM_download'
};

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
  CREDENTIAL = 'credential',
  PLATFORM_SETTING = 'platform_setting',
  URL = 'url',
  URL_MEMBER = 'url_member',
  RECENT_OBJECT = 'recent_object',
  CONTACT_HISTORY = 'contact_history',
  LINKED_OBJECT = 'linked_object',
  LINKED_COLLECTION_OBJECT = 'linked_collection_object',
  LINKED_COLLECTION_OBJECT_MEMBER = 'linked_collection_object_member',
  EMAIL_TRACKING = 'email_tracking',
  TRASH = 'trash',
  CONTACT = 'contact',
  METADATA_EMAIL = 'metadata_email',
  TODO = 'todo',
  SHARE_MEMBER = 'share_member',
  SHARE_MEMBER_MEMBER = 'share_member_member',
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
  CONFERENCE_CHAT = 'conference_chat',
  COLLECTION_ICONS = 'collection_icons',
  COLLECTION_COMMENT = 'collection_comment',
  COLLECTION_HISTORY = 'collection_history',
  COLLECTION_ACTIVITY = 'collection_activity',
  CHAT = 'chat'
}
export const API_LAST_MODIFIED_NAMES = Object.values(ApiLastModifiedName) as string[];

export enum DELETED_ITEM_LAST_MODIFIED_TYPE {
  FOLDER = 'collection'
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

export enum OBJECT_SHARE_ABLE {
  URL = 'URL',
  VEVENT = 'VEVENT',
  VJOURNAL = 'VJOURNAL',
  VTODO = 'VTODO'
}

export enum SYSTEM_COLLECTION_DEFAULT {
  NOT_DEFAULT = 0,
  DEFAULT = 1
}

export enum SYSTEM_COLLECTION {
  EMAIL = 1,
  CALENDAR = 2,
  TODOS = 3,
  CONTACTS = 4,
  NOTES = 5,
  WEBSITES = 6,
  FILES = 7,
  ORGANIZER = 8,
}

export enum PURCHASE_TYPE {
  IPHONE = 0,
  MAC = 1,
  IPAD = 2
}

export enum PURCHASE_STATUS {
  CANCEL_PURCHASE = 0,
  SUCCESS_PRUCHASE = 1
}

export enum ENABLE_SYSTEM_COLLECTION {
  DISABLE = 0,
  ENABLE = 1
}

export enum EMAIL_SUBFILTER_FILTER {
  ALL = 0,
  VIP = 1,
  STAR = 2,
  UNREAD = 4,
  BEAR_TRACK = 8
}

export enum EVENT_SUBFILTER_FILTER {
  TODAY = 0,
  DAY = 1,
  WEEK = 2,
  MONTH = 4
}

export enum EMAIL_SUBFILTER_SORTBY {
  DATE = 0,
  SUBJECT = 1,
  SENDER = 2,
  ATTACHMENT = 4
}

export enum MEMBER_SHARE_STATUS {
  JOINED = 1,
  DECLINED = 2,
  LEAVED = 4
}

export enum SHARE_STATUS {
  WAITING = 0,
  JOINED = 1,
  DECLINED = 2,
  REMOVED = 3,    // remove by owner, un-share
  LEAVED = 4,      // leave share (member leave)
  TEMP_REMOVE = -1      // worker mark it remove after 1 hour
}

export enum SQL_ERR_NO {
  ER_DUP_ENTRY = 1062
}

export enum SQL_ENTITY_NAME {
  THIRD_PARTY_ACCOUNT = 'third_party_account'
}

export const defaultJobOptions = {
  removeOnComplete: 1000, // discard this queue data when it reaches 1000 records
  removeOnFail: 5000,
  stackTraceLimit: 30
};

export enum CALLING {
  category = 'FLOWARE_VIDEO_CALL',
  priority = 'high',
  contentAvailable = 1,
  sound = 'default',
}

export enum CONTENT_AVAILABLE {
  ALERT = 0,
  SILENT = 1
}

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
  , URL_MEMBER = 'URL_MEMBER'
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
  , COMMENT_ATTACHMENT = 'COMMENT_ATTACHMENT'
  , COLLECTION_HISTORY = 'COLLECTION_HISTORY'
  , COLLECTION_ACTIVITY = 'COLLECTION_ACTIVITY'
  , COLLECTION_NOTIFICATION = 'COLLECTION_NOTIFICATION'
  , CONFERENCE_CHAT = 'CONFERENCE_CHAT'
  , CREDENTIAL = 'CREDENTIAL'
}

export const SOURCE_OBJECT_TYPE = [
  'VCARD',
  'RECEIVER',
  'SENDER',
  'INVITEE'
];

export const DESTINATION_OBJECT_TYPE = [
  'VEVENT',
  'EMAIL',
  'GMAIL',
  'EMAIL365',
  ''
];

export const ACTION = [4, 5, 6, 7, 8, 9, 10];

export const DOWNLOAD_URL_FILE = '/files/download.json?&uid=';

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
  CONFERENCING = 'CONFERENCING',
  CHAT = 'CHAT',
  SCHEDULE_CALL = 'SCHEDULE_CALL',
  CONFERENCE_HISTORY = "CONFERENCE_HISTORY"
}

export enum SUGGESTED_OBJ_TYPE {
  VTODO = 'VTODO',
  VJOURNAL = 'VJOURNAL',
  VEVENT = 'VEVENT',
  VCARD = 'VCARD',
  EMAIL = 'EMAIL',
  CSFILE = 'CSFILE',
  URL = 'URL',
  LOCAL_FILTER = 'LOCAL_FILTER',
  CALENDAR = 'CALENDAR',
  TAB_BAR = 'TAB_BAR',
  IMAP_FOLDER = 'IMAP_FOLDER'
}

export enum DAV_OBJ_TYPE {
  VJOURNAL = 'VJOURNAL',
  VTODO = 'VTODO',
  VEVENT = 'VEVENT',
  VCARD = 'VCARD',
}

export enum REQUIRED_HREF_OBJECT {
  VJOURNAL = 'VJOURNAL',
  VTODO = 'VTODO',
  VEVENT = 'VEVENT',
  VCARD = 'VCARD',
  SCHEDULE_CALL = 'SCHEDULE_CALL',
}

export const FILE_MOD = [0, 1, 2];

export enum HAS_DEL {
  notShow = 0,
  show = 1,
}

export enum SEND_STATUS {
  invite_call = 1,
  cancel_call = 2
}

export enum REPLY_SEND_STATUS {
  call_success = 20,
  call_left = 21,
  call_busy = 22,
  call_declined = 23,
  call_not_answer = 24,
  call_cancel = 25,
}

export enum COLLECTION_ALLOW_TYPE {
  UserDefined = 0,
  SystemBookmark = 1,
  UserBookmark = 2,
  SharedCollection = 3
}

export enum CALL_STATUS {
  dial_out = 1,
  dial_in = 2,
  un_answer = 3,
  miss_calling = 4
}

export enum IS_OWNER {
  owner = 1,
  not_owner = 0
}

export enum CALL_TYPE {
  video_call = 1,
  audio_call = 2
}

export enum CONFERENCE_HISTORY_STATUS_OUT {
  call_out_success = 10,
  call_out_busy = 11,
  call_out_declined = 12,
  call_out_not_answer = 13,
  call_out_cancel = 14,
}

export enum CONFERENCE_HISTORY_STATUS_IN {
  call_in_success = 20,
  call_in_left = 21,
  call_in_busy = 22,
  call_in_declined = 23,
  call_in_not_answer = 24,
  call_in_cancel = 25,
}

export const CONFERENCE_HISTORY_STATUS = {
  ...CONFERENCE_HISTORY_STATUS_OUT,
  ...CONFERENCE_HISTORY_STATUS_IN
};

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

export const FORCE_UPDATE = {
  not_force: 0,
  must_force: 1
};

export const MAIN_KEY_CACHE = 'SortOrder';

export enum SORT_OBJECTS_STATE {
  INIT = 'INIT',
  IN_PROCESS = 'IN_PROCESS',
  DONE = 'DONE'
}

export enum TRACKING_STATUS {
  WAITING = 0,
  REPLIED = 1,
  LATE = 2
}

export enum DEVICE_TYPE {
  FLO_WEB = -1,
  FLO_INTERNAL = 0,
  FLO_IPAD_QC = 1,
  FLO_IPAD_PROD = 2,
  FLO_IPHONE_QC = 3,
  FLO_IPHONE_DEV = 4,
  FLO_MAC_PROD = 5,
  FLO_MAC_QC = 6
}

export enum DEVICE_TOKEN_TYPE {
  FLO_WEB = 'FLO_WEB',
  FLO_INTERNAL = 'FLO_INTERNAL',
  FLO_IPAD = 'FLO_IPAD',
  FLO_IPHONE = 'FLO_IPHONE',
  FLO_MAC = 'FLO_MAC',
}

export enum STATUS_APP_RUN {
  DEFAULT = 0,
  ACTIVE = 1,
  BACKGROUND = 2
}

export enum ENV_SILENT {
  SILENT = 0,
  ALERT = 1
}

export enum DEVICE_ENV {
  PRODUCTION = 0,
  DEVELOPMENT = 1
}

export enum CERT_ENV {
  PRODUCTION = 0,
  DEVELOPMENT = 1,
  VOIP_PRODUCTION = 2,
  VOIP_DEVELOPMENT = 3,
}

export enum DELETED_ITEM_RECOVER_TYPE {
  NOT_RECOVERD = 0,
  RECOVERD = 1
}

export enum UPDATE_SQL_AFFECTED {
  SUCCESS_AND_EXIST = 1,
  SUCCESS_AND_NOT_EXIST = 0
}
export enum CALENDAR_INSTANCE_ACCESS {
  OWNER = 1,
  READ = 2,
  READ_WRITE = 3
}

export enum CALENDAR_INSTANCE_SHARE_INVITE_STATUS {
  NO_RESPONSE = 1,
  ACCEPTED = 2,
  DECLINED = 3,
  INVALID = 4
}

export enum IS_TRASHED {
  NOT_TRASHED = 0,
  TRASHED = 1,
  DELETED = 2,
}

export enum MEMBER_ACCESS {
  OWNER = 0,
  READ = 1,
  READ_WRITE = 2,
}

export enum INDICATE_DONE_STATUS {
  Check_mark = 0,
  Strike_through = 1
}

export enum HIDE_DONE_STATUS {
  Immediately = 0,
  Midnight = 1,
  full_hours = 2,
  Never = 3
}

export const IS_TRASHED_INPUT = [
  IS_TRASHED.NOT_TRASHED, IS_TRASHED.TRASHED
];

export enum USER_MIGRATE_STATUS {
  NOT_FOUND_USER = 0,
  NOT_MIGRATE = 1,
  MIGRATED = 2,
  MIGRATING = 3,
  INIT_MIGRATE = 4,
}

export const PRINCIPALS = 'principals/';

export const JWT_SECRET_KEY = 'er9MRwLmDQ7PH';

export const MIN_DATE_INTEGER = 0;
export const MAX_DATE_INTEGER = 2147483647;
export const MAX_INTEGER = 4294967295;

export const COLLECTION_TYPE = {
  USER_DEFINED: 0,
  SYSTEM_COLLECTION: 1,
  USER_BOOKMARK: 2,
  SHARE_COLLECTION: 3,
};

export const GLOBAL_SETTING = {
  MAX_WORKING_TIME: 7,
  MIN_WORKING_TIME: 7,
  MAX_SECONDS: 86400,
  MIN_SECONDS: 0

};

export enum CALENDAR_SETTINGS {
  CALENDAR_FLAG_ADE = 1,
  CALENDAR_FLAG_EVENT = 2,
  CALENDAR_FLAG_SCHEDULED_TASK = 4,
  CALENDAR_FLAG_DONE_TASK = 8,
  CALENDAR_FLAG_DUE_TASK = 16,
  CALENDAR_FLAG_NOTE = 32
}

/**
 * boolean in setting
 */
export enum BOOLEAN_SETTING {
  TRUE = 1,
  FALSE = 0
}

/**
 * working time day
 */
export enum WORKING_TIME_DAY {
  Mon = 'Mon', Tue = 'Tue', Wed = 'Wed',
  Thu = 'Thu', Fri = 'Fri', Sat = 'Sat', Sun = 'Sun'
}

export enum PARAMETER_GLOBAL_SETTING {
  WKT = 'working_time',
  DFCL = 'default_cal',
  TZ = 'timezone',
  AVATAR = 'avatar'
}

export const SETTING_SECOND = {
  MIN_SECOND: 0,
  MAX_SECOND: 362340
};

export enum CollectionFavorite {
  Normal = 0,
  Favorite = 1,
}

export enum CollectionIsHide {
  Normal = 0,
  Favorite = 1,
}

export const CIRTERION_VALUE = {
  MIN_ARRAY: 0,
  MAX_ARRAY: 100
};

export enum CIRTERION_TYPE {
  EMAIL_TITILE = 1,
  NOTE_TITILE = 2,
  TODO_TITILE = 4,
  EVENT_TITILE = 8,
  EVENT_INVITEE = 16,
  EVENT_LOCATION = 32,
  URL_BOOKMARK = 64,
  CONTACT_COMPANY = 128,
  EMAIL_ADDRESS = 256,
  FILE_TYPE = 512,
  CONTACT_NAME = 1024,
  LOCAL_FILTER = 2048,
  TAB_BAR = 4096,
  EMAIL_SENDER = 8192,
  EMAIL_BODY = 16384,
  CALENDAR = 32768,
  IMAP_FOLDER = 65536
}

export const HISTORY_ACTION = {
  CREATED: 0,
  EDITED: 1,
  MOVED: 2,
  DELETED: 3,
  COMPLETED: 4,
  UNDONE: 41,
  COMPLETED_SUB_TASK: 5,
  UN_COMPLETED_SUB_TASK: 51,
  COMMENTED: 6,
  UPDATED_COMMENT: 61,
  DELETED_COMMENT: 62,
  APPROVED: 7,
  CHANGED_DATE: 8,
  CHANGED_TIME: 9,
  CHANGED_LOCATION: 10,
  REJECTED: 11,
  STARTED: 12,
  TRASHED: 13,
  RECOVERED: 14,
  ADDED: 15,
  REMOVED: 16,
  ASSIGNED: 17,
  UN_ASSIGNED: 18
};

// Histories create notification
export const HISTORY_NOTI_ACTION = {
  CREATED: 0,
  EDITED: 1,
  COMPLETED: 4,
  UNDONE: 41,
  COMMENTED: 6,
  TRASHED: 13,
  RECOVERED: 14,
  ASSIGNED: 17,
  UN_ASSIGNED: 18,
};

export enum THUMBNAIL_TYPE {
  prefix = 'thumbnail_',
  isThump = 1,
}
export enum SORT_FIELD_FOR_SHARE {
  ACTION_TIME = 'action_time',
  CREATED_DATE = 'created_date',
  UPDATED_DATE = 'updated_date',
}

export enum SORT_FIELD_FOR_SCHEDULE_CALL {
  START_TIME = 'start_time'
}

export enum SORT_FIELD_FOR_CONFERENCE {
  TITLE = 'title',
  CREATED_DATE = 'created_date',
  ACTION_TIME = 'action_time',
  LAST_CALL = 'last_call',
  LAST_CHAT = 'last_chat',
}

export enum SORT_FIELD_FOR_CONFERENCE_HISTORY {
  ACTION_TIME = 'action_time',
  UPDATED_DATE = 'updated_date',
}

export enum SOURCE_TYPE_FILE_COMMON {
  COMMENT = 'COMMENT',
  CHAT = 'CHAT',
}
export const AWS_S3_DOWNLOAD_EXPIRE_TIME_DEFAULT = 900; // 15 minutes

export enum CONFERENCE_FILTER_TYPE {
  SEARCH_BY_CHANNEL = 1,
  SEARCH_BY_MEMBER = 2,
  SEARCH_ALL = 3,
  MISSED_CALL = 4,
  ONE_PARTICIPANT = 5,
  NO_COLLECTION = 6
}

export enum COMMENT_FILTER_TYPE {
  ALL_COMMENT = 0,
  MENTION = 1
}
export const maxFile = 10;
export enum SALT {
  TOTAL_SALT = 51,
  MAX_LENGTH = 32
}

export enum CHAT_CHANNEL_TYPE {
  CONFERENCE = 1,
  SHARED_COLLECTION = 0
}

export enum NOTIFICATION_STATUS {
  ALL = 0,
  NEW = 1,
  READ = 2,
  UNREAD = 3,
  CLOSED = 4,
}

export enum NOTIFICATION_ACTION_ALLOW_FILTER {
  CREATED = 0,
  EDITED = 1,
  DONE = 4,
  UNDONE = 41,
  COMMENT = 6,
  TRASHED = 13
}

export enum NOTIFICATION_ASSIGNMENT_FILTER {
  ALL = 0,
  NOT_ASSIGNED = 1,
  ASSIGNED_TO_ME = 2,
  ASSIGNED_BY_ME = 3,
  ALL_TODO = 4
}

export enum PARTICIPANT {
  OWNER = 1,
  NORMAL = 0,
  TEMP = 2
}

export enum SORT_TYPE {
  DESC = 'DESC',
  ASC = 'ASC',
}

export enum NOTIFICATION_STATUS_VALUE {
  UNREAD = 0,
  READ = 1,
  CLOSED = 2
}

export enum SORT_FIELD_FOR_CHAT_REALTIME {
  CREATED_DATE = 'created_date'
}