module.exports = {
  SYSTEM_ERROR: 500,

  SUBS_SUCCESS: 0,
  SUBS_ERROR: 1,

  // Data Errors
  INVALID_PAYLOAD_PARAMS: 400, // for when the requested information is incomplete or malformed
  INVALID_SERVICE: 404, // for when everything is okay, but the resource doesn’t exist.
  INVALID_DATA: 422, // for when the requested information is okay, but invalid.

  // Auth Errors 
  INVALID_TOKEN: 401, // for when an access token isn’t provided, or is invalid.
  INVALID_PERMISSION: 403, // for when an access token is valid, but requires more privileges.

  // Standard Statuses

  REQUEST_SUCCESS: 200, // for when everything is okay
  DELETE_SUCCESS: 204, // for when everything is okay, but there’s no content to return.
  NO_CONTENT: 204, // for when everything is okay, but there’s no content to return.
  CREATE_SUCCESS: 201,
  NOT_FOUND: 404,

  UPLOADING: 10001,
  NOT_RELEASE: 10002 // not release any versions yet
};

