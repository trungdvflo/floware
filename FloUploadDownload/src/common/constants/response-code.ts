export enum ResponseCode {
  MULTI_STATUS = 207,
  SYSTEM_ERROR = 500,
  // Data Errors
  INVALID_PAYLOAD_PARAMS = 400, // for when the requested information is incomplete or malformed
  INVALID_SERVICE = 404, // for when everything is okay, but the resource doesn’t exist.
  INVALID_DATA = 422, // for when the requested information is okay, but invalid.
  // Auth Errors
  INVALID_TOKEN = 401, // for when an access token isn’t provided, or is invalid.
  INVALID_PERMISSION = 403, // for when an access token is valid, but requires more privileges.
  // Standard Statuses
  REQUEST_SUCCESS = 200, // for when everything is okay
  DELETE_SUCCESS = 204, // for when everything is okay, but there’s no content to return.
  NO_CONTENT = 204, // for when everything is okay, but there’s no content to return.
  // redirect status response code indicates that the resource requested has been
  // temporarily moved to the URL given by the Location header.
  FOUND = 302,
  CREATE_SUCCESS = 201,
  NOT_FOUND = 404,
  UPLOADING = 10001,
  NOT_RELEASE = 10002, // not release any versions yet,

  OTR_EXPIRED = -3001,
  INVALID_SIGNATURE = -3002,

  DISALLOWED_FILE_TYPE = -5001,
  DISALLOWED_FILE_SIZE = -5002,
  DISALLOWED_IMAGE_DIMENSION = -5003,

  REFRESH_TOKEN_EXPIRED = -1001,
  ACCESS_TOKEN_UP_TIME = -1002,
  INVALID_REFRESH_TOKEN = -1003,
  USER_BLOCK = -1004,
  USER_DELETED = -1005,
  INVALID_OR_MISSING_USERNAME = -1006,

  API_SUCCESS = 0,
  API_USER_EXISTED = 1,
  API_USER_NOT_EXISTED = 2,
  API_PASS_INVALID = 3,
  API_USER_INVALID = 4,

  API_APPREG_INVALID = 5,
  API_SIG_INVALID = 7,
  API_SEC_EMAIL_INVALID = 8,

  API_ITEM_NOT_EXIST = 9,
  API_ITEM_CANNOT_SAVE = 10,
  API_ITEM_CANNOT_DELETE = 11,

  API_ITEM_NO_URI = 12,

  API_RECEIPT_DATA_EXISTED = 13,
  API_RECEIPT_DATA_FAILED = 14,
  API_TRANSACTION_INVALID = 15,
  API_RECEIPT_DATA_INVALID = 16,
  API_TRANSACTION_EXISTED = 17,
  API_USER_DISABLED = 18,
  CAN_NOT_DOWNLOAD = 19,
  FILE_NOT_FOUND = 20,
  INVALID_RECORD = 21,
  RECORD_NOT_FOUND = 22,
  UNAUTHORIZED = 23,
  UPLOAD_FAILED = 24,
  PARAMETER_MISSING = 25,
  EMAIL_NOT_ALLOWED_CODE = 26,
  NOT_AUTHORIZED = 27,
  CAN_NOT_ADD_THIRD_PARTY = 28,
  OVER_LIMITED_PARAMS = 29,
  SIGNATURE_INVALID = -3002,
  ACCESSTOKEN_INVALID = 31,
  OTR_INVALID = -3001,
  PARAMETER_INVALID = 33,
  UNEXPECTED_ERROR = 500,
  ICLOUD_USER_INVALID = 64,
  YAHOO_USER_INVALID = 128,
  CARDDAV_USER_INVALID = 256,
}