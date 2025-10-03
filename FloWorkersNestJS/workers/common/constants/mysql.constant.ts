const COLLECTION: string = 'collection';

export type SQL_SP = {
  spName: string;
  spParam: number;
};

export const SEND_LAST_MODIFY_SHARE:
  SQL_SP = {
  spName: `c2022_sendLastModifyShare`,
  spParam: 3
};

export const SEND_LAST_MODIFY_CONFERENCE:
  SQL_SP = {
  spName: `c2023_sendLastModifyConference`,
  spParam: 3
};

export const GENERATE_DELETED_ITEM_FOR_SHARED:
  SQL_SP = {
  spName: `d2022_generateDeletedItemForShared`,
  spParam: 4
};

export const GENERATE_DELETED_ITEM_FOR_MEMBER:
  SQL_SP = {
  spName: `d2022_generateDeletedItemForMember`,
  spParam: 4
};

export const DELETE_ACTIVITY_BY_UID:
  SQL_SP = {
  spName: `c2022_deleteActivityByUID`,
  spParam: 2
};

export const COLLECT_INVALID_LINK_TO_EMAIL:
  SQL_SP = {
  spName: `f2023_collectInvalidLinkToEmailV2`,
  spParam: 4
};

export const GET_LIST_USER_TO_SCAN_EMAIL_LINK:
  SQL_SP = {
  spName: `f2023_getListUserToScanEmailLink`,
  spParam: 3
};
export const GET_LIST_INVALID_LINK:
  SQL_SP = {
  spName: `f2023_getListInvalidLink`,
  spParam: 3
};

export const GET_LIST_USER_TO_SCAN_OBJECT_LINK:
  SQL_SP = {
  spName: `f2023_getListUserToScanFloObject`,
  spParam: 3
};

export const GET_LIST_EMAIL_LINKS_4_USER:
  SQL_SP = {
  spName: `f2023_getListEmailLinks4User`,
  spParam: 2
};

export const COLLECT_INVALID_LINKS_4_USER:
  SQL_SP = {
  spName: `f2023_collectInvalidLinks4User`,
  spParam: 5
};

export const REMOVE_SINGLE_INVALID_LINKS:
  SQL_SP = {
  spName: `f2023_removeSingleInvalidLinks`,
  spParam: 4
};

export const UPDATE_USER_PROCESS_INVALID_DATA
  : SQL_SP = {
  spName: 'f2023_updateUserProcessInvalidDataV2',
  spParam: 7
};

export const CLEAN_INVALID_LINKS_4_USER: SQL_SP = {
  spName: 'f2023_cleanInvalidLinks4User',
  spParam: 4
};

export const REMOVE_FIL_CONSIDERING: SQL_SP = {
  spName: 'f2023_removeFILConsidering',
  spParam: 3
};

export const LIST_COLLECTION_NOTIFICATION_OUTDATED: SQL_SP = {
  spName: 'n2023_listOfNotificationOutdated',
  spParam: 3
};

export const SP_DELETE_NOTIFICATION:
  SQL_SP = {
  spName: 'n2023_workerDeleteCollectionNotification',
  spParam: 3
};