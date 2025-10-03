module.exports = {
  APP_NAME: 'FloBackendAdmin',
  EXPIRE_TIME: 60 * 60 * 4, // 4h, 14400s
  SIGNATURE_KEY: '9mkwW8tMW5j4w6S4esqDLDqe',
  EXPIRE_TIME_DOWNLOAD: 60 * 60, // 1h
  AUTO_UPDATE_PATH: process.env.AUTO_UPDATE_PATH ? process.env.AUTO_UPDATE_PATH : 'flobackend_nodejs/autoUpdate',
  AUTO_UPDATE_LOCAL_PATH: 'autoUpdate',
  ACCOUNT_TYPE: {
    1: 'Google',
    2: 'Yahoo',
    3: 'Other Email',
    4: 'Other Caldav',
    5: 'iCloud',
    // 6: 'SmartDay Account',
    7: 'Other Account'
  },
  ACCOUNT_ROLE: {
    TEAM_LEAD: 0,
    PO: 1
  },
  ACCOUNT_TYPE_MAP: {
    0: 1,
    1: 2,
    2: 5,
    3: [3, 7]
  },
  SUBSCRIPTION_TYPE_DEFAULT: 'com.floware.flo.product.',
  SUBSCRIPTION_TYPE_MAP: {
    0: ['com.floware.flo.product.monthlypremium', 'com.floware.flo.product.yearlypremium'],
    1: ['com.floware.flo.product.monthlypro', 'com.floware.flo.product.yearlypro'],
    2: ['ea0f0fa86f3320eac0a8155a4cc0b8e563dd']
  },
  DELETED_USER_CLEANING_WAIT_TIME_SECOND:
    +process.env.DELETED_USER_CLEANING_WAIT_TIME_SECOND || 60 * 60 * 24 * 30, // Default 30 days
  SYSTEM_ADMIN_ADDRESSES: [{ address: process.env.FLO_FEEDBACK_EMAIL_ADDRESS, name: process.env.FLO_FEEDBACK_NAME || process.env.FLO_FEEDBACK_EMAIL_ADDRESS }],
  SYSTEM_ADMIN_ADDRESSES_BCC: process.env.FLO_FEEDBACK_EMAIL_ADDRESS_BCC ? [{ address: process.env.FLO_FEEDBACK_EMAIL_ADDRESS_BCC, name: process.env.FLO_FEEDBACK_NAME_BCC || process.env.FLO_FEEDBACK_EMAIL_ADDRESS_BCC }] : [],
  PATH_UPLOAD: process.env.PATH_UPLOAD,
  FILE_SERVER: process.env.FILE_SERVER,
  RSA: {
    PUBLIC_KEY: process.env.RSA_PUBLIC_KEY || '',
    PRIVATE_KEY: process.env.RSA_PRIVATE_KEY || ''
  },
  EMAIL_TYPE: 'EMAIL',
  IMAP_SERVER: process.env.IMAP_SERVER,
  IMAP_PORT: process.env.IMAP_PORT,
  SMTP_SERVER: process.env.SMTP_SERVER,
  SMTP_PORT: process.env.SMTP_PORT || 25,
  MAX_FEEDBACK_CONTENT_LENGTH: 25000000, // 25MB
  DEVICE_UID_LENGTH_ALLOW: [10, 50],
  TOKEN_TYPE: 'Bearer',
  MAIN_KEY_CACHE: 'OAuth',
  ACCESS_TOKEN_LENGTH_IN_BYTE: 32,
  ACCESS_TOKEN_LENGTH: 64,
  REFRESH_TOKEN_LENGTH_IN_BYTE: 32,
  REFRESH_TOKEN_LENGTH: 64,
  AUTHORIZATION_KEY_CACHE: 'Authorization',
  INTERNAL_EMAIL_BASE_URI: process.env.INTERNAL_EMAIL_BASE_URI,
  INTERNAL_EMAIL_REQUEST_TIMEOUT: +process.env.INTERNAL_EMAIL_REQUEST_TIMEOUT || 6000,
  AES_KEY: process.env.FLO_AES_KEY,
  IV_LENGTH: 32,
  IV_LENGTH_IN_BYTE: 16,
  AES_ALGORITHM: 'aes-256-cbc',
  QUEUE_NAMES: {
    REVERT_USER_DATA_MIGRATE_QUEUE_NAME: 'revertDataMigrateUserQueue_v4_1',
    USER_DATA_MIGRATE_QUEUE: 'userDataMigrateQueue_v4_1',
    REPORT_CACHED_USER_QUEUE: 'reportCachedUserQueue',
  },
  USER_MIGRATE_DATA_CACHE: 'FLO_OAUTH_MIGRATE_DATA_USER_',
  USER_MIGRATE_STATUS: {
    IS_V4: 1,
    IS_V32: 0,
    IS_MIGRATED: 2
  },
  USER_MIGRATE_PROCESS: {
    NOT_FOUND_USER: 0,
    NOT_MIGRATE: 1,
    MIGRATED: 2,
    MIGRATING: 3,
    INIT_MIGRATE: 4,
    MIGRATE_FAILED: -1
  },
  SERVICE_HEALTH_CHECK_TIMEOUT:
    process.env.SERVICE_HEALTH_CHECK_TIMEOUT ? Number(process.env.SERVICE_HEALTH_CHECK_TIMEOUT) : 10000, // 10 second

  UPLOAD_STATUS: {
    NOT_UPLOAD: 0,
    UPLOADING: 1,
    UPLOADED_SUCCESS: 2,
    UPLOAD_FAILED: 3,
    MAX_WAITING_TIME: process.env.MAX_UPLOAD_WAITING_TIME || 60 * 60 * 1000, // 1 hour
  },

  SUBS_TYPE: {
    STANDARD: 0,
    PREMIUM: 1,
    PRO: 2,
  },
  APP_REG_ID: {
    FLO_ONLINE: 'e70f1b125cbad944424393cf309efaf0',
    FLO_MAC: 'ad944424393cf309efaf0e70f1b125cb',
    FLO_IOS: 'faf0e70f1bad944424393cf309e125cb',
    FLO_IPAD: 'd944424393cf309e125cbfaf0e70f1ba',
    SABREDAV: '323d0aa8b591b15d68360faf4c853641',
    FLO_MAC_INTERNAL: 'fd99981046681b6bbc2124c72e569591'
  },
  FLO_MAC_UPDATED: {
    UPDATED: 1,
    NOT_UPDATE: 0
  },
  FILTER_TYPE: {
    ALL: 1,
    ANY: 0
  },
  INTERNAL_MAIL_URL: process.env.INTERNAL_MAIL_URL,
  INTERNAL_MAIL_REQUEST_TIMEOUT: process.env.INTERNAL_MAIL_REQUEST_TIMEOUT ? Number(process.env.INTERNAL_MAIL_REQUEST_TIMEOUT) : 10000,

  DOWNLOAD_PATH: 'downloads?',
};

