
export const LAST_MODIFIED_REPORT_CACHE = ['third_party_account'];
export const DELETE_FUNC = {
  CALDAV: 'calendar_deleteObject',
};
export const PUSH_CHANGE_CONFIG = {
  INTERVAL_STOP_PUSH: 1000, // 1s
  SILENT_VALID: [0, 1],
  OFFSET: 0,
  LIMIT: 100,
};

export enum IS_TRASHED {
  NOT_TRASHED = 0,
  TRASHED = 1,
  DELETED = 2,
}

export const COLLECTION_TYPE = {
  SHARE_COLLECTION: 3,
};

export enum SHARE_STATUS {
  WAITING = 0,
  JOINED = 1,
  DECLINED = 2,
  REMOVED = 3,    // remove by owner, un-share
  LEAVED = 4,      // leave share (member leave)
  TEMP_REMOVE = -1      // worker mark it remove after 1 hour
}

export enum OBJ_TYPE {
  VJOURNAL = 'VJOURNAL',
  VTODO = 'VTODO',
  VEVENT = 'VEVENT',
  VCARD = 'VCARD',
  URL = 'URL',
  EMAIL = 'EMAIL',
  GMAIL = 'GMAIL',
  FOLDER = 'FOLDER',
  FILE = 'FILE',
  CSFILE = 'CSFILE',
  KANBAN = 'KANBAN',
  CANVAS = 'CANVAS',
  MEMBER = 'MEMBER',
  RECENTLY = 'RECENTLY'
}
export enum TRASH_TYPE {
  CANVAS = 'CANVAS'
  , EMAIL = 'EMAIL'
  , CSFILE = 'CSFILE'
  , FOLDER = 'FOLDER'
  , URL = 'URL'
  , VCARD = 'VCARD'
  , VEVENT = 'VEVENT'
  , VJOURNAL = 'VJOURNAL'
  , VTODO = 'VTODO'
}

export enum KANBAN_TYPE {
  NORMAL = 0,
  SYSTEM = 1,
}

export const RESET_ORDER_CONFIG = {
  MAX_ITEM_EACH_TIME_GET: 1000,
  DECREASE_ORDER_NUM: -1,
  INCREASE_ORDER_NUM: 1,
  REDIS_TTL: 3600, // 1 hours,
  REDIS_TTL_WHEN_DONE: 300 // 5m
};

export enum CALDAV_OBJ_TYPE {
  VJOURNAL = 'VJOURNAL',
  VTODO = 'VTODO',
  VEVENT = 'VEVENT',
}

export enum CARDAV_OBJ_TYPE {
  VCARD = 'VCARD',
}

export enum SHARE_OBJ_TYPE {
  URL = 'URL',
  VEVENT = 'VEVENT',
  VJOURNAL = 'VJOURNAL',
  VTODO = 'VTODO'
}

export const SABREDAV_SHARED = {
  INVITEE: 2
};

export const SABREDAV_URL = '/calendarserver.php/calendars/';
export const SABREDAV_HEADER = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': 0,
  'Content-Type': 'text/calendar',
  'x-source': 'floworker'
};

export const SABREDAV_PRO_ID = '-//Flo//EN';

export const DEFAULT_CALENDAR_TIMEZONE = `BEGIN:VCALENDAR
PRODID:icalendar-nodejs
VERSION:2.0
BEGIN:VTIMEZONE
TZID:America/Chicago
TZURL:http://tzurl.org/zoneinfo-outlook/America/Chicago
X-LIC-LOCATION:America/Chicago
BEGIN:DAYLIGHT
TZOFFSETFROM:-0600
TZOFFSETTO:-0500
TZNAME:CDT
DTSTART:19700308T020000
RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=2SU
END:DAYLIGHT
BEGIN:STANDARD
TZOFFSETFROM:-0500
TZOFFSETTO:-0600
TZNAME:CST
DTSTART:19701101T020000
RRULE:FREQ=YEARLY;BYMONTH=11;BYDAY=1SU
END:STANDARD
END:VTIMEZONE
END:VCALENDAR
`;

export enum SORT_OBJECTS_STATE {
  INIT = 'INIT',
  IN_PROCESS = 'IN_PROCESS',
  DONE = 'DONE'
}

export enum SORT_OBJECT_TYPE {
  VTODO = OBJ_TYPE.VTODO,
  URL = OBJ_TYPE.URL,
  CSFILE = OBJ_TYPE.CSFILE,
  KANBAN = OBJ_TYPE.KANBAN,
  CANVAS = OBJ_TYPE.CANVAS
}

export const SORT_OBJECT = {
  ITEM_TYPES: ['VTODO', 'URL', 'FILE', 'KANBAN', 'CANVAS'],
  MAX_ORDER_NUMBER: 999999,
  MIN_ORDER_NUMBER: -999999,
  MAX_ORDER_NUMBER_LENGTH: 10,
  MAX_ORDER_NUMBER_TO_FIXED: 9,
  ORDER_NUMBER_MOVE_TOP: 1,
  ORDER_NUMBER_MOVE_BOTTOM: 1,
  ORDER_UPDATE_TIME_ADD: 0.001,
  REDIS_TTL: 3600, // 1h
  FUNC: 'SortObjects',
};

export enum SOURCE_TYPE_FILE_COMMON {
  COMMENT = 'COMMENT',
}
