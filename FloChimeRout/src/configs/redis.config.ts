import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || undefined,
  port: process.env.REDIS_PORT || 6379,
  db: process.env.REDIS_DB || undefined,
  password: process.env.REDIS_PASS || undefined,
  tls: process.env.REDIS_TLS ? JSON.parse(process.env.REDIS_TLS) : false,
}));
