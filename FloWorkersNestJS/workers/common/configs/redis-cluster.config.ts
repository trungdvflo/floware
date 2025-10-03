import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_CLUSTER_HOST || undefined,
  port: process.env.REDIS_CLUSTER_PORT || 46379,
  db: process.env.REDIS_CLUSTER_DB || 0,
  tls: process.env.REDIS_CLUSTER_TLS ? JSON.parse(process.env.REDIS_CLUSTER_TLS) : false,
  password: process.env.REDIS_CLUSTER_PASS || undefined,
  removeOnComplete: +process.env.REDIS_REMOVE_ON_COMPLETE || 5,
  removeOnFail: +process.env.REDIS_REMOVE_ON_FAIL || 200
}));