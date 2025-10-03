export enum ErrorCode {
  /**
   * HttpCode 400
   */
  BAD_REQUEST = 'badRequest',
  UNAUTHORIZED_REQUEST = 'unauthorizedRequest',
  VALIDATION_FAILED = 'validationFailed',
  INVALID_DATA = 'invalidData',
  DUPLICATE_ENTRY = 'duplicateEntry',
  FILE_NOT_FOUND = 'fileNotFound',
  /**
   * HttpCode 200
   */
  REQUEST_SUCCESS = "requestSuccess",
}