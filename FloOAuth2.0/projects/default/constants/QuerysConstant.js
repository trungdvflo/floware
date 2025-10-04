const Joi = require('joi');

module.exports = {
  // CODE: Joi.number().description('The number of pages posted to the server'),
  CODE: Joi.string().description('Functional error code'),
  MESSAGE: Joi.string().description('The message returned to the client'),
  /**
     * Authorization
     */
  ACCESS_TOKEN: Joi.string()
    .example(
      'y7umlOvb-o_7bUkDs2bm2nx9rjIVHqxZaqI95BPISaazUogqI4XczjLovt'
    )
    .description(
      'Access Tokens are used in token-based authentication to allow an application to access an GAPI.'
    ),
  REFRESH_TOKEN: Joi.string()
    .example('iXMWPcRxhu2lQVV_9FKvz3ie_Djf-kk2PEGE')
    .description(
      'A Refresh Token allows the application to issue a new Access Token or ID Token without having to re-authenticate the user.'
    ),
  TOKEN_TYPE: Joi.string()
    .example('Bearer')
    .description('Authentication type of system'),
  EXPIRY_DATE: Joi.number()
    .example(1563955727364)
    .description('AccessToken expiration time. Type: milliseconds'),
  MIGRATE_STATUS: Joi.number()
    .valid(-1, 1, 2, 3, 4)
    .description(`User's migration status: 
    -1 >> migrate failed
    1 >> not yet migrate 
    2 >> migrated data
    3 >> migrating data`),

  REVERT_MIGRATE_STATUS: Joi.number()
    .valid(3)
    .description(`User's migration status: 
    3 >> revert migrating data
    `),
  USER_HAS_FLO_MAC: Joi.number()
    .valid(0, 1)
    .description(`User's has Flo MAC status: 
    0 >> Not yet have a FloMac app
    1 >> Have a FloMac app
    `),
  MIGRATE_PERCENT: Joi.number()
    .min(0)
    .max(100)
    .description('Migrate percent'),
  REVERT_MIGRATE_PERCENT: Joi.number()
    .min(0)
    .max(100)
    .description('Revert migrate percent'),
  APP_ID: Joi.string()
    .example('e70f1b125cbad944424393cf309efaf0')
    .description('Flo app type, refer to table app_register'),
  DEVICE_ID: Joi.string()
    .min(1)
    .max(100)
    .example('29938b8b68d12d9949d6523390fcf6094183228d2e9f5079ad4a94e738ae5ac5')
    .description('* Character identifier string of the device for push notification \n * With FloOnline, Device Token is generated at random and stored in local storage. '),
  USER_AGENT: Joi.string()
    .example('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.37')
    .description('* User Agent is a web client\'s identification string when sending requests to the web server.'),
  IP: Joi.string()
    .example('127.0.0.1')
    .description('* IP address connecting to the internet of the client'),
  PLATFORM: Joi.string()
    .example('IOS 13.2.2')
    .description('* Information of the client\'s operating system'),
  UUID: Joi.string()
    .example('IOS 13.2.2')
    .description('* (Universally Unique Identifier): A sequence of 128 bits that can guarantee uniqueness across space and time'),
  GRANT_TYPE: Joi.string()
    .example('password')
    .description('* This must be password'),
  INTERNAL_GROUP: Joi.number()
    .valid(1, 2, 3, 4, 5, 6)
    .description(`Test Accounts should be automatically added to correct groups
      internal_group = 1 => add to web test group
      internal_group = 2 => add to mac test group
      internal_group = 3 => add to iphone test group
      internal_group = 4 => add to ipad test group
      internal_group = 5 => add to qa test group
      internal_group = 6 => add to auto test group`),
  GRANT_TYPE_REFRESH: Joi.string()
    .example('refresh_token')
    .description('* This must be refresh_token'),
  PASSWORD64: Joi.string()
    // eslint-disable-next-line max-len
    .example('WFj2dfbdj421BrFVPoePhVlY6gmSKMZLzWJz34kxXYdlPYRbBK95YbqQ0Nt3FSHtMOpzCX6dvK+DyULvHWImqz8Ccu5JpSvzn4NWua9/h7qHdb5IUKq6FglQ==')
    .description('* The end user\'s password with base64 formated'),
  OAUTH_ACCESS_TOKEN: Joi.string()
    .example('eyJhbGciOiJIUzI1oyMzEyMzEzMTMxMTMzMTIzMjB9.4PkTIItFLJW-N8uQ4u0NTD0ue4ewgx9q6mSj9oef0AQ')
    .description(`Access tokens are the thing that applications use to make API requests on behalf of a user 
    Format: {token}`),
  REVOKE_TYPE: Joi.string()
    .valid('on_device', 'all_device')
    .example('on_device')
    .description('* on_device: Revoke permissions on only 1 device  \n * all_device: Revoke permissions for all devices'),
  DEVICE_UUID: Joi.string()
    .min(36)
    .max(36)
    .example('E4128CA3-EB4F-45BD-ABF3-68557ECC408E')
    .description('* Character identifier string of the device \n * With FloOnline, Device UUID is generated at random and stored in local storage. '),
  HEADERS_ACCESS_TOKEN: Joi.object({
    device_uid: Joi.string()
      .min(10)
      .max(50)
      .example('E4128CA3-EB4F-45BD-ABF3-68557ECC408F')
      .description('* Character identifier string of the device \n * With FloOnline, Device UUID is generated at random and stored in local storage. ')
      .required(),
    app_id: Joi.string()
      .min(32)
      .max(32)
      .example('e70f1b125cbad944424393cf309efaf0')
      .description('Flo app type, refer to table app_register')
      .required(),
    authorization: Joi.string()
      .max(500)
      .example('4PkTIItFLJW-N8uQ4u0NTD0ue4ewgx9q6mSj9oef0AQ')
      .description(`Access tokens are the thing that applications use to make API requests on behalf of a user. \n Format: Bearer {token}
    `)
      .required(),
    user_agent: Joi.string()
      .max(500)
      .example('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.35')
      .description('* User Agent is a web client\'s identification string when sending requests to the web server.')
      .optional()
      .allow(null, '')
  }).options({
    allowUnknown: true 
  }),
  HEADERS_APP_ID_DEVICE_UID: Joi.object({
    device_uid: Joi.string()
      .min(10)
      .max(50)
      .example('E4128CA3-EB4F-45BD-ABF3-68557ECC408D')
      .description('* Character identifier string of the device \n * With FloOnline, Device UUID is generated at random and stored in local storage. ')
      .required(),
    app_id: Joi.string()
      .min(32)
      .max(32)
      .example('e70f1b125cbad944424393cf309efaf0')
      .description('Flo app type, refer to table app_register')
      .required(),
    user_agent: Joi.string()
      .max(500)
      .example('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.34')
      .description('* User Agent is a web client\'s identification string when sending requests to the web server.')
      .optional()
      .allow(null, '')
  }).options({
    allowUnknown: true 
  }),
  RESET_PASSWORD_TOKEN: Joi.string()
    .example('7d9d482f2eebade62831683678b292c9')
    .description('* The token to reset password'),
  /**
    * User Constant
    * */
  EMAIL: Joi.string()
    .example('test@123flomail.net')
    .description('User\'s email'),

  THIRD_PARTY_EMAIL: Joi.string()
    .email()
    .min(5)
    .max(100)
    .example('test@gmail.com')
    .description('User\'s third-party email'),

  MD5_EMAIL: Joi.string()
    .min(32)
    .max(32)
    .example('94516fec34367af80809eef0a43417ef')
    .description('User\'s email in MD5 Hash'),

  TIMEZONE: Joi.string()
    .max(100)
    .example('Asia/Jakarta')
    .description('Timezone of the user. Flo will use this timezone to run bug calendar and time'),

  ALIAS: Joi.string()
    .min(1)
    .max(100)
    .example('cbad944424393cf309efaf0e70f1b125')
    .description('Alias of the app'),

  // EMAIL
  REVOKE_SUCCESS: Joi.boolean().example(true).description('Revoke successfully'),
  RESET_SUCCESS: Joi.boolean().example(true).description('Reset password successfully'),
  EMAIL_EXIST: Joi.boolean().example(true).description('Email exist status'),
  EMPTY_DATA_ERROR: Joi.array().items()
};
