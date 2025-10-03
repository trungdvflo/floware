// ================== For API ==================
export const MSG_NOT_FOUND_USER = 'Not found user';
export const MSG_NOT_FOUND_MEMBER = 'Not found member';
export const MSG_DATA_INVALID = 'Data invalid';
export const MSG_INVALID_CHANNEL_ID = 'Channel is not found';
export const INVALID_REQUEST = 'Your request is invalid.';
export const INVALID_MESSAGE_UID = 'Message uid is invalid.';
export const MSG_APPREG_INVALID = "Your application registry is invalid.";
export const MSG_TOKEN_EXPIRED = "Unauthorized. Your token was expired.";
export const MSG_TOKEN_INVALID = "Unauthorized. Authorization info is undefined or the wrong format.";
export const MSG_APPREG_TAKEN = 'App reg has already been taken';

// ############## collection ##############
export const MSG_COLECTION_NOT_ROOT = 'Collection default is not root';
export const MSG_COLECTION_NOT_ALLOW_TRASH = 'Sorry you are not allowed to Trash this Collection';
export const MSG_COLECTION_SHARE = 'Collection default is the share-collection';
export const MSG_COLECTION_ID_INVALID = 'Type of collection is invalid';
// ############## recent_object ##############
export const MSG_DATA_NOT_ARRAY = 'Data not array';

// ############## error message #################
export const MSG_ERR_TOO_LONG = "Data is too long.";
export const MSG_ERR_SYSTEM_KANBAN = "Can not generate system kanban";
export const MSG_ERR_EXISTED = "The item is existed.";
export const MSG_ERR_INVALID = "The item is invalid (or existed)";
export const MSG_ERR_OBJ_EMPTY = "The item is invalid, empty properties";
export const MSG_ERR_NOT_EXIST = "The item does not exist";
export const MSG_ERR_COLLECTION_SAME = "Moved to the same collection";
export const MSG_ERR_DUPLICATE_ENTRY = "Duplicate entry";
export const MSG_ERR_NO_DEVICE_TOKEN = "Device token is not found";
export const MSG_ERR_ALREADY_EXIST_DEVICE_TOKEN = "Already exist device token";
export const MSG_ERR_INPUT_INVALID = 'Invalid input';
export const MSG_ERR_BAD_REQUEST = 'Bad Request';
export const MSG_ERR_NOT_FOUND = 'Not found';
export const MSG_ORDER_NUMBER_OUT_OF_RANGE = 'Order number is out of range. Please reset order number';
export const MSG_CONFERENCE_NOT_EXIST = 'The conference not existed.';
export const CHANNEL_DOES_NOT_EXIST = 'Channel is not found';
export const MSG_CONFERENCE_NOT_EDIT_PER =
  'Access denied. Please contact to the conference owner.';

export const MSG_ERR_UPLOAD = "The item can not upload";
export const MSG_ERR_DOWNLOAD = "The item can not download";
export const MSG_ERR_DOWNLOAD_DENIED = "Access denied.";
export const MSG_FILE_EMPTY = "Please select file";
export const MSG_FILE_NOT_EXIST = "File id does not exist";

export const MSG_FIND_NOT_FOUND = "The item not found";
export const MSG_ITEM_IS_IN_DELETED_ITEM_COLLECTION = "Item is in deleted item";
export const MSG_INVALID_PAYLOAD_FORMAT = "Invalid payload format";

export const MSG_ERR_WHEN_CREATE = "Create failed";
export const MSG_ERR_WHEN_UPDATE = "Update failed";
export const MSG_ERR_WHEN_DELETE = "Delete failed";
export const MSG_ERR_SERVER_ERROR = "Internal server error";
export const MSG_ERR_WHEN_MOVE = "Move failed";
export const MSG_ERR_ID_UID_NOT_BLANK = "Object ID and Object Uid not blank";

export const MSG_CAN_NOT_ADD_FLO_MAIL = 'Sorry, you can not add a Flo email address as another account.';

export const MSG_ERR_CREATE_CHANNEL_FAILED = "Can not create conference channel";
export const MSG_ERR_UPDATE_MEMBER_FAILED = "Can not update conference channel";
export const MSG_ERR_REVOKE_MEMBER_FAILED = "Can not delete conference channel";

export enum ERR_COLLECTION_ACTIVITY {
  MSG_ERR_CREATE_COMMENT_FAILED = "Can not create comment",
  MSG_ERR_UPDATE_COMMENT_FAILED = "Can not update comment",
  MSG_ERR_DELETE_COMMENT_FAILED = "Comment not found",
  MSG_ERR_DELETE_HISTORY_FAILED = "History not found",
  MSG_ERR_CREATE_HISTORY_FAILED = "Collection history not found",
  NOT_ALLOW_CHANGE_COMMENT = "Do not allow delete or update comment from the other",
  NOT_ALLOW_CHANGE_FILE = "Do not allow delete or update files comment from the other",
  NOT_ALLOW_UPDATE_FILE = "Do not allow update files comment from the other",
  COLLECTION_TRASHED_DELETED = 'The collection was trashed or deleted',
  COLLECTION_TRASHED = 'The collection was trashed',
  OBJECT_TRASHED = "This object was trashed or deleted",
  MENTION_MEMBER_NOT_FOUND = "Mentioned member not found!",
  COLLECTION_NOT_EDIT_PER = 'Access denied. Please contact to the collection owner.',
  COLLECTION_NOT_JOIN = 'Please join the collection or contact to the collection owner.',
  UPDATE_NOTIFICATION_STATUS_FAILED = 'Can not update the notification status.',
  DELETE_NOTIFICATION_STATUS_FAILED = 'Can not delete the notification.',
}

// ================== For Web ==================
export const MSG_TERMINATE_ACC_NOT_EXIST = "This account does not exist on our system";

// ############## platform relase ##############
export const PLATFORM_RELEASE_NOT_FOUND = 'Platform release doesn\'t exist';

export const PROTECT_PASSWORD_INVALID = "Protect password is invalid";
export enum SortObjectResponseMessage {
  SENT_SUCCESS = 'Data has been sent successfully',
  INVALID_REQUEST_UID = 'Invalid request uid',
  IN_PROCESS = 'Request uid: %s is in process',
  SORT_OBJECT_EXPIRED = 'Request uid is incorrect,' +
  ' please request GET Object Orders for latest data',
  SORT_OBJECT_RANGE_LIMIT_REACHED = 'Invalid Order Number length, max valid Order Number is 16 digits with 10 decimals (-999999.0000000000 >> 999999.0000000000)',
  SORT_OBJECT_OBJECT_DATA_ATTRIBUTE = 'Invalid objects data infomation, object_type [%s] only accept object [%s]',
  SORT_OBJECT_ID_DUPLICATED = 'Request has duplicated item id',
  SORT_OBJECT_UID_DUPLICATED = 'Request has duplicated item uid',
  SORT_OBJECT_ORDER_NUMBER_DUPLICATED = 'Request has duplicated Order Number',
  ORDER_NUMBER_INVALID = 'Order Number must be string number or number',
  RESET_ORDER_IS_IN_PROGRESS = 'Reset order is in progress',
}

// ############## link error ##############
export enum MSG_ERR_LINK {
  INVALID_ACCOUNT_ID = '%s is not existed in third party table',
  LINK_NOT_EXIST = 'Link does not exist.',
  OBJECT_UID_TRASHED = 'Object uid is trashed',
  OBJECT_UID_DELETE = 'Object uid is deleted',
  LINK_TRASHED = 'Link is trashed.',
  COLLECTION_NOT_EXIST = 'Collection does not exist.',
  COLLECTION_NOT_EDIT_PER = 'Access denied. Please contact to the collection owner.',
  COLLECTION_NOT_JOIN = 'Please join the collection or contact to the collection owner.',
}

export enum MSG_ERR_CONTACT_HISTORY {
  INVALID_SOURCE_ACCOUNT = 'Source account id is not existed in third party table',
  INVALID_DES_ACCOUNT = 'Destination account id is not existed in third party table',
}

export enum MSG_ERR_VIDEO_HISTORY {
  INVALID_INVITEE = 'Invitee is not existed',
}

export enum MSG_VALIDATE_CHAT_OBJECT {
  COMMON_FILE_ID = 'file_common_id %s required',
}

export enum MSG_VALIDATE_OBJECT {
  OBJECT_UID_IS_JSON = '%s must be a JSON object',
  OBJECT_UID_IS_STRING = '%s must be a string',
  OBJECT_HREF_IS_REQUIRED = '%s is required, the value must be a string',
  OBJECT_HREF_NOT_REQUIRED = '%s is not required with this object type',
  UID_IS_NUMBER = 'uid must be a positive integer',
  PATH_IS_STRING = 'path must be a string',
  RRULE_IS_INVALID = '%s value is invalid.',
  INVALID_EMAIL_OBJECT_ID = 'Invalid email object id',
}

export enum MSG_ERR_EVENT {
  CALENDAR_URI_INVALID = 'calendar_uri is invalid or not existed.',
  EVENT_NOT_EXIST = 'Event does not exist.',
  SCHEDULE_STATUS_CODE_INVALID = 'schedule_status value invalid. Value must be array number 1.xx, 2.xx, 3.xx, 4.xx',
}

export enum MSG_ERR_TODO {
  TODO_NOT_EXIST = 'Todo does not exist.',
}

export enum MSG_ERR_CALENDAR {
  DUPLICATED_DISPLAYNAME = 'Duplicate displayname of calendar',
  CALENDAR_URI_DOES_NOT_EXIST = 'Calendar uri does not exist',
  OLD_CALENDAR_URI_DOES_NOT_EXIST = 'Old calendar uri does not exist',
}

export enum MSG_ERR_ADDRESS_BOOK {
  ADDRESS_BOOK_EXIST = 'Address book already exists. You cannot create multiple Address books',
  CAN_NOT_MULTI = 'You cannot create multiple Address books',
}
export enum MSG_ERR_HEADER {
  DEVICE_UID_LENGTH_MUST_BE_AT_LEAST_10_CHARACTERS_LONG = 'device_uid length must be at least 10 characters long',
  DEVICE_UID_LENGTH_MUST_BE_LESS_THAN_OR_EQUAL_TO_50_CHARACTERS_LONG = 'device_uid length must be less than or equal to 50 characters long',
  INVALID_DEVICE_UID = 'Invalid device_uid',
  DEVICE_UID_IS_REQUIRED = 'device_uid is required',
  APP_ID_IS_REQUIRED = 'app_id is required',
  INVALID_USER_AGENT = 'Invalid user_agent',
}

export enum MSG_ERR_GLOBAL_SETTING {
  IMIN_MUST_BE_SMALLER_OR_EQUAL_TO_IMAX = 'iMin must be smaller or equal to iMax'
}

export enum MSG_PUSH_MAIL {
  INVITED_CALL = 'You are invited to join room by ',
  BODY_CALL = 'Silent Push Notification'
}

export enum CALL_NOTIFICATION {
   BODY = 'is inviting you to a call',
}

export enum ERR_REPLY_QUOTE_FORWARD_MESSAGE {
  MSG_ERR_GET_ORIGINAL_MESSAGE = "Can not get original message",
  MSG_ERR_CANNOT_ACTION_ON_DELETED_MESSAGE = "Can not action on a deleted message",
  MSG_ERR_NOT_FOUND_ORIGINAL_MESSAGE = "Origin message is not found",
}