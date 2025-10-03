import { registerAs } from '@nestjs/config';

export default registerAs('redisWsAdapter', () => ({
  host: process.env.REDIS_CLUSTER_HOST || undefined,
  port: process.env.REDIS_CLUSTER_PORT || 6379,
  db: process.env.REDIS_CLUSTER_DB || 0,
  password: process.env.REDIS_CLUSTER_PASS || undefined,
  tls: process.env.REDIS_CLUSTER_TLS ? JSON.parse(process.env.REDIS_CLUSTER_TLS) : false,
}));
