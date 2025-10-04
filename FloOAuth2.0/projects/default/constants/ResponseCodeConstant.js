module.exports = {
  // HttpStatusCode
  NOT_IMPLEMENTED: 501, // The server does not support the functionality required to fulfill the request.
  SYSTEM_ERROR: 500, // The server encountered an unexpected condition that prevented it from fulfilling the request.
  INVALID_DATA: 422, // for when the requested information is okay, but invalid.
  INVALID_SERVICE: 404, // for when everything is okay, but the resource doesn’t exist.
  NOT_FOUND: 404, // The origin server did not find a current representation for the target resource or is not willing to disclose that one exists.
  INVALID_PERMISSION: 403, // for when an access token is valid, but requires more privileges.
  INVALID_TOKEN: 401, // for when an access token isn’t provided, or is invalid.
  INVALID_PAYLOAD_PARAMS: 400, // for when the requested information is incomplete or malformed
  // Standard Statuses
  NOT_MODIFIED: 304, // A conditional GET or HEAD request has been received and would have resulted in a 200 OK response if it were not for the fact that the condition evaluated to false
  FOUND: 302, // redirect status response code indicates that the resource requested has been temporarily moved to the URL given by the Location header.
  CREATE_SUCCESS: 201,
  REQUEST_SUCCESS: 200, // for when everything is okay
  DELETE_SUCCESS: 204, // for when everything is okay, but there’s no content to return.
  NO_CONTENT: 204, // for when everything is okay, but there’s no content to return.

  // 
  FUNC_INVALID_REFRESH_TOKEN: 'invalidRefreshToken',
  FUNC_REFRESH_TOKEN_EXPIRED: 'refreshTokenExpired',
  FUNC_ACCESS_TOKEN_UP_TIME: 'accessTokenUpTime',
  FUNC_INVALID_ACCESS_TOKEN: 'invalidAccessToken',
  FUNC_USER_DELETED: 'userDeleted',
  FUNC_BAD_REQUEST: 'badRequest',
  FUNC_VALIDATION_FAILED: 'validationFailed',
  FUNC_INVALID_DATA: 'invalidData',
  FUNC_AUTHENTICATION_FAILED: 'authenticationFailed',
  FUNC_USER_BLOCK: 'userBlock',
  FUNC_UNAUTHORIZED: 'unauthorized',
  FUNC_NOT_FOUND: 'notFound',
  FUNC_FORBIDDEN: 'forbidden',
  FUNC_USER_NOT_FOUND: 'userNotFound',
  FUNC_USER_NOT_MIGRATE: 'userNotMigrate',
  FUNC_USER_MIGRATED: 'userMigrated',
  FUNC_USER_MIGRATING: 'userMigrating',
  FUNC_USER_MIGRATE_FAILED: 'userMigrateFailed'
};
