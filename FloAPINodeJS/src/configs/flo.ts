import { registerAs } from '@nestjs/config';

export default registerAs('flo', () => ({
  emailDomain: process.env.EMAIL_DOMAIN,
  aesIV: process.env.FLO_AES_IV_KEY,
  aesKey: process.env.FLO_AES_KEY,
  caldavServerURL: process.env.FLOL_CALDAV_SERVER_URL,
  smtpEmail: process.env.SMTP_EMAIL_ADDRESS,
  smtpPwd: process.env.SMTP_EMAIL_PASSWORD,
  // tslint:disable-next-line: max-line-length
  serviceHealthCheck: process.env.SERVICE_HEALTH_CHECK_TIMEOUT ? Number(process.env.SERVICE_HEALTH_CHECK_TIMEOUT) : 1000,
}));