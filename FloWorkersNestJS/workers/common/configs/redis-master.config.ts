import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || undefined,
  port: +process.env.REDIS_PORT || 6379,
  db: +process.env.REDIS_DB || 2,
  password: process.env.REDIS_PASS || undefined,
  tls: process.env.REDIS_TLS ? JSON.parse(process.env.REDIS_TLS) : false,
  removeOnComplete: +process.env.REDIS_REMOVE_ON_COMPLETE || 5,
  removeOnFail: +process.env.REDIS_REMOVE_ON_FAIL || 200
}));