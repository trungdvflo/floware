/**
 */
const HISTORY: string = 'history';
const COLLECTION: string = 'collection';
const COMMENT: string = 'comment';
const CONFERENCE: string = 'conference';
const MODIFY: string = 'modify';
const CREDENTIAL: string = 'credential';
const SALT: string = 'salt';

type SQL_SP = {
  spName: string;
  spParam: number;
  callType?: string;
};
enum CallType {
  PROCEDURE = 'CALL',
  FUNCTION = 'SELECT',
}
const regSqlSP = (spName: string, spParam: number, callType: CallType):
  SQL_SP => ({ spName, spParam, callType });

export const TABLE_CREDENTIAL: string = `${CREDENTIAL}`;
export const TABLE_SALT: string = `${SALT}`;
export const TABLE_CHANNEL: string = `${CONFERENCE}_channel`;
export const TABLE_MEMBER: string = `${CONFERENCE}_member`;
export const TABLE_CHAT: string = `${CONFERENCE}_chat`;
export const TABLE_CONFERENCE_HISTORY: string = `${CONFERENCE}_history`;
export const TABLE_CONFERENCE_MEETING: string = `${CONFERENCE}_meeting`;
export const TABLE_ICON: string = `${COLLECTION}_icon`;
export const TABLE_COMMENT: string = `${COLLECTION}_${COMMENT}`;
export const TABLE_HISTORY: string = `${COLLECTION}_${HISTORY}`;
export const TABLE_ACTIVITY: string = `${COLLECTION}_activity`;
export const TABLE_MENTION: string = `${COMMENT}_mention`;
export const TABLE_MENTION_USER: string = `mention_user`;

export const PROC_GET_HISTORIES:
  SQL_SP = regSqlSP(`c2023_listOfCollectionHistoryV2`, 10, CallType.PROCEDURE);

export const PROC_GET_NOTIFICATIONS:
  SQL_SP = regSqlSP(`n2023_listOfNotificationV2`, 14, CallType.PROCEDURE);

export const PROC_GET_COMMENTS:
  SQL_SP = regSqlSP(`c2023_getListCommentV4`, 14, CallType.PROCEDURE);

export const PROC_CREATE_COMMENT:
  SQL_SP = regSqlSP('c2024_createCollectionComment', 13, CallType.PROCEDURE);

export const PROC_DELETE_COMMENT:
  SQL_SP = regSqlSP('c2023_removeComment', 3, CallType.PROCEDURE);

export const FUNC_MENTION:
  SQL_SP = regSqlSP('c2023_createCommentMentionV2', 5, CallType.FUNCTION);

export const FUNC_REMOVE_MENTION:
  SQL_SP = regSqlSP('c2023_removeAllMention', 2, CallType.FUNCTION);

export const PROC_GET_MENTION_USERS:
  SQL_SP = regSqlSP(`c2023_listOfContactInCollection`, 3, CallType.PROCEDURE);

export const FUNC_CREATE_NOTIFICATION:
  SQL_SP = regSqlSP('c2023_createNotificationV2', 11, CallType.FUNCTION);

export const FUNC_CREATE_NOTIFICATION_AFTER_DEL:
  SQL_SP = regSqlSP('collection_createNotiAfterTrashDelete', 9, CallType.FUNCTION);

export const LIST_OF_DEVICE_TOKEN:
  SQL_SP = regSqlSP(`d2023_listOfDeviceToken`, 3, CallType.PROCEDURE);

export const LIST_OF_DEVICE_UID:
  SQL_SP = regSqlSP(`d2024_listOfDeviceWebUid`, 1, CallType.PROCEDURE);

export const LIST_OF_CONFERENCE:
  SQL_SP = regSqlSP(`c2024_listOfConferenceV2`, 15, CallType.PROCEDURE);

export const LIST_OF_CONFERENCE_HISTORY:
  SQL_SP = regSqlSP(`c2023_listOfConferenceHistoryV2`, 11, CallType.PROCEDURE);

export const CHECK_EXIST_CHANNEL_BY_MEMBER:
  SQL_SP = regSqlSP(`c2023_checkExistChannelByMember`, 2, CallType.FUNCTION);

export const CREATE_CONFERENCE_HISTORY_SEND_INVITE:
  SQL_SP = regSqlSP(`c2023_createConferenceHistorySendInvite`, 7, CallType.PROCEDURE);

export const CREATE_CONFERENCE_HISTORY_SEND_INVITE_V2:
  SQL_SP = regSqlSP(`c2023_createConferenceHistorySendInviteV2`, 8, CallType.PROCEDURE);

export const PROC_CREATE_HISTORY:
  SQL_SP = regSqlSP(`c2023_createCollectionHistoryV2`, 11, CallType.PROCEDURE);

export const PROC_DELETE_HISTORY:
  SQL_SP = regSqlSP(`c2023_removeCollectionHistory`, 3, CallType.PROCEDURE);

export const INSERT_LAST_MODIFY:
  SQL_SP = regSqlSP(`m2023_insertAPILastModify`, 3, CallType.PROCEDURE);

export const FUNC_UPDATE_NOTIFICATION_STATUS:
  SQL_SP = regSqlSP(`n2023_updateNotificationStatusForUserV2`, 5, CallType.PROCEDURE);

export const PROC_CREATE_CHANNEL:
  SQL_SP = regSqlSP(`c2023_createChannel`, 12, CallType.PROCEDURE);

export const PROC_LEAVE_CHANNEL:
  SQL_SP = regSqlSP(`c2022_leaveChannel`, 4, CallType.PROCEDURE);

export const PROC_UPDATE_MEMBER:
  SQL_SP = regSqlSP(`c2023_updateChannel`, 10, CallType.PROCEDURE);

export const SP_CHECK_CHANNEL_EXIST:
  SQL_SP = regSqlSP(`c2023_conferenceCheckChannel`, 4, CallType.PROCEDURE);

export const SP_MOVE_CHANNEL:
  SQL_SP = regSqlSP(`c2023_moveChannelToCollection`, 4, CallType.PROCEDURE);

export const SP_DELETE_NOTIFICATION:
  SQL_SP = regSqlSP('n2023_softDeleteCollectionNotification', 3, CallType.FUNCTION);

export const FUNC_GENERATE_SYSTEM_KANBAN:
  SQL_SP = regSqlSP('k2024_generateSystemKanban', 3, CallType.FUNCTION);

export const GENERATE_DELETED_ITEM_SHARED_OMNI
  : SQL_SP = regSqlSP('collection_generateDeletedItemSharedOmni', 5, CallType.FUNCTION);

export const PROCEDURE_GET_USER_SUBSCRIPTION
  : SQL_SP = regSqlSP('get_user_subcription', 1, CallType.PROCEDURE);

export const COLLECTION_MOVE_ACTIVITY
  : SQL_SP = regSqlSP('a2024_moveCollectionActivity', 8, CallType.PROCEDURE);

export const CONFERENCE_SCHEDULE_CALL
  : SQL_SP = regSqlSP('c2024_listOfScheduleCallV2', 7, CallType.PROCEDURE);