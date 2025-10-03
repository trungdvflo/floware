import { Queue } from 'bullmq';
import { JobName, QueueName } from '../../../commons/constants/queues.contanst';
import { redisClient } from '../../../configs/redis.config';
import { EmailObject } from '../entities/email.object';

export class SubscriptionSendEmailQueue extends Queue {
  constructor() {
    super(QueueName.SUBSCRIPTION_SEND_EMAIL, {
      connection: redisClient,
      defaultJobOptions: {
        removeOnComplete: +process.env.REDIS_REMOVE_ON_COMPLETE || 20,
        removeOnFail: +process.env.REDIS_REMOVE_ON_FAIL || 50,
        stackTraceLimit: 30,
        delay: 100,
        attempts: 3
      },
    });
  }

  async addJob(email: EmailObject) {
    const jobName = JobName.SUBSCRIPTION_SEND_EMAIL_JOB;
    return this.add(jobName, email);
  }

  // todo
  
}
