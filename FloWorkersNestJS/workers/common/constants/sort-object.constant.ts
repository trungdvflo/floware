export const SYSTEM_KANBAN = {
  'NOTIFICATIONS': {
    color: '#49BB89',
    sortType: 3,
    name: 'Notifications'
  },
  'RECENTLY': {
    color: '#007AFF',
    sortType: 3,
    name: 'Recently Added'
  },
  'VEVENT': {
    color: '#f94956',
    sortType: 3,
    name: 'Events'
  },
  'VTODO': {
    color: '#7CCD2D',
    sortType: 0,
    name: "ToDo's"
  },
  'VCARD': {
    color: '#a0867d',
    sortType: 1,
    name: 'Contacts'
  },
  'VJOURNAL': {
    color: '#FFA834',
    sortType: 3,
    name: 'Notes'
  },
  'URL': {
    color: '#B658DE',
    sortType: 3,
    name: 'Websites'
  },
  'EMAIL': {
    color: '#0074b3',
    sortType: 3,
    name: 'Email'
  },
  'FILE': {
    color: '#969696',
    sortType: 0,
    name: 'Files'
  },
  'MEMBER': {
    color: '#666666',
    sortType: 0,
    name: 'Members'
  },
  'CALLS': {
    color: '#49BB89',
    sortType: 3,
    name: 'Calls'
  },
};
export const MAIN_KEY_CACHE: string = 'SortOrder';
export enum OBJ_TYPE {
  VJOURNAL = 'VJOURNAL',
  VTODO = 'VTODO',
  VEVENT = 'VEVENT',
  VCARD = 'VCARD',
  URL = 'URL',
  EMAIL = 'EMAIL',
  RECENTLY = 'RECENTLY',
  MEMBER = 'MEMBER',
  GMAIL = 'GMAIL',
  FOLDER = 'FOLDER',
  FILE = 'FILE',
  KANBAN = 'KANBAN',
  CANVAS = 'CANVAS',
  CSFILE = 'CSFILE',
  NOTIFICATIONS = 'NOTIFICATIONS',
  CALLS = 'CALLS',
}

export enum ITEM_TYPE {
  HISTORY = 'HISTORY',
  LINK = 'LINK',
  COLLECTION_LINK = 'COLLECTION_LINK',
  COLLECTION_LINK_MEMBER = 'COLLECTION_LINK_MEMBER',

  ORDER_OBJ = 'ORDER_OBJ',
  RECENT_OBJ = 'RECENT_OBJ',
  SET_3RD_ACC = 'SET_3RD_ACC',
  SUGGESTED_COLLECTIONTRACK = 'SUGGESTED_COLLECTIONTRACK',
  TRASH = 'TRASH',
  VCARD_AVATAR = 'VCARD_AVATAR',
  TRACK = 'TRACK',
  METADATA_EMAIL = 'METADATA_EMAIL',
  NOTE = 'NOTE',
  SHARE_MEMBER = 'SHARE_MEMBER',
  FOLDER_MEMBER = 'FOLDER_MEMBER',
  URL_MEMBER = 'URL_MEMBER',
  COMMENT_ATTACHMENT = 'COMMENT_ATTACHMENT'
}

export type DELETED_ITEM_TYPE = OBJ_TYPE | ITEM_TYPE;
export const DELETED_ITEM_TYPE = { ...OBJ_TYPE, ...ITEM_TYPE };

export const RESET_ORDER_STATUS = {
  IN_PROCESS: 'IN_PROCESS',
  DONE: 'DONE',
  FAIL: 'FAIL'
};

export const RESET_FUNC = {
  CLOUD: 'sort_resetOrderNumberCloud',
  TODO: 'sort_resetOrderNumberTodo',
  URL: 'sort_resetOrderNumberUrl',
  KANBAN: 'sort_resetOrderNumberKanban',
  KANBAN_CARD: 'sort_resetOrderNumberKanbanCard'
};