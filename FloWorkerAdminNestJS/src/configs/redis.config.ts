import Redis from 'ioredis';
import { Graylog } from './graylog.config';

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: Number(process.env.REDIS_PORT) || 6379,
  db: process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0,
  password: process.env.REDIS_PASS,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  tls: process.env.REDIS_TLS ? JSON.parse(process.env.REDIS_TLS) : false,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    // tslint:disable-next-line: no-console
    console.log('Redis reconnectOnError ', err);
    Graylog.getInstance().LogError(err);
    return 1;
  }
});

redisClient.on('error', (err) => {
  // tslint:disable-next-line: no-console
  console.log('Redis error ', err);
  Graylog.getInstance().SendLog({
    moduleName: "redis",
    message: 'ERROR: redis',
    fullMessage: err.message
  });
});

export { redisClient };
