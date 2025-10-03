import { Injectable } from '@nestjs/common';
import { IEmailObject } from '../../common/interface/subscription.interface';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import {
    SUBSCRIPTION_SEND_EMAIL_JOB,
    SUBSCRIPTION_SEND_EMAIL_QUEUE
} from '../common/constants/worker.constant';
import { CommonService } from './common.service';

@Injectable()
export class SubscriptionRabbitMQProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly commonService: CommonService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: SUBSCRIPTION_SEND_EMAIL_QUEUE,
      concurrency: SUBSCRIPTION_SEND_EMAIL_JOB.CONCURRENCY,
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.commonService);
  }

  async process (job: JobMQ, commonService: CommonService) {
    try {
      const data: IEmailObject = job.data;
      await commonService.sendEmailSubscription(data);
      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: SUBSCRIPTION_SEND_EMAIL_QUEUE,
        jobName: job.jobName,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

}