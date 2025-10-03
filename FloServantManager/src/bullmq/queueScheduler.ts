import { QueueScheduler } from 'bullmq';
import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  enableReadyCheck: false,
  maxRetriesPerRequest:null
});

export function queueScheduler (queueName: string) {
  const queueScheduler = new QueueScheduler(queueName, {
    connection: redisClient
  });

  // Later when shuting down gracefulle
  // queueScheduler.close();
  return queueScheduler;
}
