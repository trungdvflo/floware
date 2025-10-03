// ================== For API ==================
export const MSG_NOT_FOUND_USER = 'Not found user';
export const MSG_NOT_FOUND_MEMBER = 'Not found member';
export const MSG_DATA_INVALID = 'Data invalid';

export const MSG_APPREG_INVALID = "Your application registry is invalid.";
export const MSG_TOKEN_EXPIRED = "Unauthorized. Your token was expired.";
export const MSG_TOKEN_INVALID = "Unauthorized. Authorization info is undefined or the wrong format.";
export const MSG_APPREG_TAKEN = 'App reg has already been taken';

// ############## error message #################
export const MSG_ERR_SERVER_ERROR = "Internal server error";
export const MSG_ERR_EXISTED = "The item is existed.";
export const MSG_ERR_INVALID = "The item is invalid (or existed)";
export const MSG_ERR_NOT_EXIST = "The item does not exist";
export const MSG_ERR_DUPLICATE_ENTRY = "Duplicate entry";
export const MSG_ERR_INPUT_INVALID = 'Invalid input';
export const MSG_ERR_BAD_REQUEST = 'Bad Request';
export const MSG_ERR_NOT_FOUND = 'Not found';
export const MSG_ERR_WHEN_DELETE = "Delete failed";
export const MSG_FIND_NOT_FOUND = "The item not found";
export const MSG_INVALID_PAYLOAD_FORMAT = "Invalid payload format";
export const MSG_NOT_ALLOW = "Upload not allow";

// ############## platform relase ##############
export const PLATFORM_RELEASE_NOT_FOUND = 'Platform release doesn\'t exist';

export enum MSG_ERR_HEADER {
  DEVICE_UID_LENGTH_MUST_BE_AT_LEAST_10_CHARACTERS_LONG = 'device_uid length must be at least 10 characters long',
  DEVICE_UID_LENGTH_MUST_BE_LESS_THAN_OR_EQUAL_TO_50_CHARACTERS_LONG = 'device_uid length must be less than or equal to 50 characters long',
  INVALID_DEVICE_UID = 'Invalid device_uid',
  DEVICE_UID_IS_REQUIRED = 'device_uid is required',
  APP_ID_IS_REQUIRED = 'app_id is required',
  INVALID_USER_AGENT = 'Invalid user_agent',
}

export const MSG_ERR_DOWNLOAD = {
  ITEM_CAN_NOT_DL: "The item can not download",
  ITEM_CAN_NOT_UL: "The item can not upload",
  FILE_NOT_EXIST: 'File does not exist',
  PLS_SELECT_FILE: "Please select file",
  APP_ID_NOT_EXIST: 'App ID not exist',
  DOWNLOAD_ERROR: 'Download Error'
};