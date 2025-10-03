import { registerAs } from '@nestjs/config';

export default registerAs('worker', () => ({
  baseUrl:  process.env.BASE_URL,
  floDavUrl: process.env.FLOL_CALDAV_SERVER_URL,
  name: process.env.APP_NAME,
  port: parseInt(process.env.APP_PORT, 10) ||  1321,
  secretKey : process.env.APP_SECRET_KEY,
  version: process.env.APP_VERSION,
  rsaPrivate: process.env.RSA_PRIVATE_KEY,
  baseV41Url: process.env.BASE_API_V4_URL,
  pemDevice: JSON.parse(process.env.KEY_MAP_PUSH_NOTIFY),
  pushExpire: +process.env.PUSH_EXPIRY || 3600,
  floLogo: process.env.FLO_LOGO_URL,
  floCopyright: process.env.FLO_COPYRIGHT,
  realTimeServiceURL: process.env.REAL_TIME_SERVICE_URL,
  realTimeExpiredToken: process.env.REAL_TIME_TOKEN_EXPIRED_TIME,
  realTimeSecret: process.env.REAL_TIME_SECRET_KEY,
}));