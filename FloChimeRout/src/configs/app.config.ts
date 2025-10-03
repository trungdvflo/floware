import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME,
  port: parseInt(process.env.APP_PORT, 10) || 1986,
  secretKey: process.env.APP_SECRET_KEY,
  jwtSecretKey: process.env.JWT_SECRET_KEY || 'er9MRwLmDQ7PH',
  version: process.env.APP_VERSION,
  serverMailUrl: process.env.INTERNAL_EMAIL_BASE_URI,
  apnKeyPath: process.env.PUSH_NOTIFY_KEY_PATH,
  apnKeyMap: process.env.KEY_MAP_PUSH_NOTIFY,
  apnKeyVoip: process.env.KEY_MAP_VOIP_NOTIFY,
  floDomain: process.env.FLO_DOMAIN,
  chimeLimit: +process.env.CHIME_ATTENDEE_LIMIT,
  chimeDelay: +process.env.CHIME_DELAY || 10,
  chimeMaxSize: +process.env.CHIME_MAX_BATCH_SIZE || 10,
  apnExpire: parseInt(process.env.PUSH_EXPIRY, 10) || 3600,
  realTimeServiceURL: process.env.REAL_TIME_SERVICE_URL || '',
  realTimeExpiredToken: process.env.REAL_TIME_TOKEN_EXPIRED_TIME,
  realTimeSecret: process.env.REAL_TIME_SECRET_KEY,
  meetingEndTimeout: process.env.MEETING_END_TIMEOUT || 60000, // defaults 1 minute
  meetingEndTimeoutNoneUser: process.env.MEETING_END_TIMEOUT_NONE_USER || 300000, // defaults 5 minutes
}));
