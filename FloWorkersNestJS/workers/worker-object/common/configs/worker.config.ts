import { registerAs } from '@nestjs/config';

export default registerAs('worker', () => ({
  baseUrl:  process.env.BASE_URL,
  name: process.env.APP_NAME,
  port: parseInt(process.env.APP_PORT, 10) ||  1321,
  secretKey : process.env.APP_SECRET_KEY,
  version: process.env.APP_VERSION,
  rsaPrivate: process.env.RSA_PRIVATE_KEY
}));