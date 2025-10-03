export enum ErrorCode {
  DEVICE_TOKEN_DOES_NOT_EXIST = 400,
  BAD_REQUEST = 'badRequest',
  DUPLICATE_ENTRY = 'duplicateEntry',
  UNAUTHORIZED_REQUEST = 'unauthorizedRequest',
  VALIDATION_FAILED = 'validationFailed',
  INVALID_APP_UID = 'invalidAppUid',
}
export enum ChimeErrorCode {
  AccessDenied = "AccessDenied",
  BadRequest = "BadRequest",
  Conflict = "Conflict",
  Forbidden =  "Forbidden",
  NotFound = "NotFound",
  PhoneNumberAssociationsExist =  "PhoneNumberAssociationsExist",
  PreconditionFailed = "PreconditionFailed",
  ResourceLimitExceeded = "ResourceLimitExceeded",
  ServiceFailure = "ServiceFailure",
  ServiceUnavailable = "ServiceUnavailable",
  Throttled = "Throttled",
  Throttling = "Throttling",
  Unauthorized = "Unauthorized",
  Unprocessable = "Unprocessable",
  VoiceConnectorGroupAssociationsExist = "VoiceConnectorGroupAssociationsExist",
}

export const ChimeErrorCodeNotAbleRetry =  [
  ChimeErrorCode.BadRequest,
  ChimeErrorCode.AccessDenied, 
  ChimeErrorCode.Conflict, 
  ChimeErrorCode.Forbidden,
  ChimeErrorCode.NotFound, 
  ChimeErrorCode.PhoneNumberAssociationsExist, 
  ChimeErrorCode.Unauthorized,
  ChimeErrorCode.Unprocessable,
  ChimeErrorCode.VoiceConnectorGroupAssociationsExist,
  ChimeErrorCode.PreconditionFailed
]

export enum ErrorMessage {
  MSG_ERR_WHEN_CREATE = 'Create failed',
  MSG_ERR_WHEN_DELETE = 'Delete failed',
  MSG_ERR_SERVER_ERROR = 'Internal server error',
  MSG_ERR_DUPLICATE_ENTRY = 'Duplicate entry',
  MSG_ERR_BAD_REQUEST = 'Bad Request',
  VALIDATION_FAILED = 'validationFailed',
  DATA_INVALID = 'Data invalid',
  DEVICE_TOKEN_DOES_NOT_EXIST = 'Device token is not found',
  CHANNEL_DOES_NOT_EXIST = 'Channel is not found',
  CHANNEL_EXIST = 'Channel is created',
  MEMBER_EXIST = 'Member is existed',
  MEMBER_NOT_EXIST = 'Member is not existed',
  MEMBER_CHANNEL_NOT_EXIST = 'Member is not existed in this channel',
  USER_DOES_NOT_EXIST = 'User is not found',
  MSG_TOKEN_EXPIRED = 'Unauthorized. Your token was expired.',
  MSG_TOKEN_INVALID = 'Unauthorized. Authorization info is undefined or the wrong format.',
  MSG_APPREG_TAKEN = 'App reg has already been taken',
}
