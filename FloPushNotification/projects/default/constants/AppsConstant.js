module.exports = {
    EXPIRE_TIME: 60 * 60 * 4, // 4h, 14400s
    EXPIRE_TIME_OTP: 60 * 60 * 0.5, // 30p
    SIGNATURE_KEY: 'CWWKGONZ73B6EE5EG37X6PBGES5XIQFW',
    EXPIRE_TIME_DOWNLOAD: 60 * 60, // 1h
    AUTO_UPDATE_PATH: 'autoUpdate',
    CONTACT_AVATAR_PATH: 'contact-avatar',
    AES_KEY: process.env.AES_KEY,
    RABBITMQ: process.env.RABBITMQ,
    REGISTER_PUSH_GMAIL: 'register_push_gmail',
    HANDLE_PUSH_GMAIL: 'handle_push_gmail',
    KEY_MAP_PUSH_NOTIFY: process.env.KEY_MAP_PUSH_NOTIFY ? JSON.parse(process.env.KEY_MAP_PUSH_NOTIFY) : '',
    ACTION_TYPE: ['collection', 'number', 'string', 'comboBox'],
    AUTO_WATCH_GMAIL: 'auto_watch_gmail',
    ACCESS_TOKEN_EXPIRE_TIME: 60 * 60 * 4, // expire 4h
    REFRESH_TOKEN_EXPIRE_TIME: 60 * 60 * 24 * 30, // expire 30 day
    HANDLE_WEBHOOK_GMAIL: 'handle_webhook_gmail',
    MAIN_KEY_CACHE: 'BE_NODEJS_API',
    BE_KEY_CACHE: 'BE',
    Redis: {
        TTL: 3600
    },
    CONTACT_AVATAR_SIZE_LIST: [
        [32, 32],
        [64, 64],
        [128, 128],
        [256, 256],
        [512, 512]
    ],
    CRON_TIME_CLEANING_DELETED_USER_DATA: process.env.CRON_TIME_CLEANING_DELETED_USER_DATA || '0 * * * *' // Default 1 hour
};
