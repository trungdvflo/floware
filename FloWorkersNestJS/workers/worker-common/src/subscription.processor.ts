import {
    Process,
    Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { IEmailObject } from '../../common/interface/subscription.interface';
import { Graylog } from '../../common/utils/graylog';
import {
    SUBSCRIPTION_SEND_EMAIL_JOB,
    SUBSCRIPTION_SEND_EMAIL_QUEUE
} from '../common/constants/worker.constant';
import { CommonService } from './common.service';
@Processor(SUBSCRIPTION_SEND_EMAIL_QUEUE)
export class SubscriptionProcessor {
  constructor(private readonly commonService: CommonService) { }

  @Process({
    name: SUBSCRIPTION_SEND_EMAIL_JOB.NAME,
    concurrency: SUBSCRIPTION_SEND_EMAIL_JOB.CONCURRENCY
  })
  async sendEmailHandle(job: Job): Promise<void> {
    this.handleSendEmail(job);
  }

  async handleSendEmail(job: Job) {
    try {
      const data: IEmailObject = job.data;
      await this.commonService.sendEmailSubscription(data);
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: SUBSCRIPTION_SEND_EMAIL_QUEUE,
        jobName: SUBSCRIPTION_SEND_EMAIL_JOB.NAME,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}