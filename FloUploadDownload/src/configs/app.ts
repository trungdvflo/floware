import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  baseUrl:  process.env.BASE_URL,
  name: process.env.APP_NAME,
  port: parseInt(process.env.APP_PORT, 10) ||  1321,
  secretKey : process.env.APP_SECRET_KEY,
  version: process.env.APP_VERSION,
  log: (!process.env.LOG_LEVEL ? 'info' : process.env.LOG_LEVEL).split(',') || ['info'],
  rsaPrivate: process.env.RSA_PRIVATE_KEY,
  floAESKey: process.env.FLO_AES_KEY,
  ivLength: 32,
  ivLengthInByte: 16,
  accessTokenLength: 64,
  tokenType: 'Bearer',
  swaggerUi: String(process.env.SWAGGER_UI_ENABLED).toLowerCase() === 'true',
  limitBodySize: process.env.LIMIT_BODY_SIZE? (+process.env.LIMIT_BODY_SIZE)*1024*1024
    : 20*1024*1024,
  serverMailUrl: process.env.INTERNAL_EMAIL_BASE_URI,
  serverAuthDomain: process.env.INTERNAL_AUTH_BASE_URI,
  sandboxApi: process.env.API_PATH_SUBS_BUY,
  testSanboxApi: process.env.API_PATH_SUBS_SANDBOX,
  passTestSanbox: process.env.API_SUBS_PASS_VERIFY,
}));