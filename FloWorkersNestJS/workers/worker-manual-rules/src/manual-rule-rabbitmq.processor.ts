import { Injectable } from '@nestjs/common';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import {
    DOVECOT_LINKED_MAIL_COLLECTION,
    DOVECOT_LINKED_MAIL_COLLECTION_JOB
} from '../common/constants/worker.constant';
import { IManualRule } from '../common/interfaces/manual-rule.interface';
import { ManualRuleService } from './manual-rule.service';

@Injectable()
export class ManualRuleRabbitMQProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly manualRuleService: ManualRuleService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: DOVECOT_LINKED_MAIL_COLLECTION,
      concurrency: DOVECOT_LINKED_MAIL_COLLECTION_JOB.CONCURRENCY
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.manualRuleService);
  }

  async process (job: JobMQ, manualRuleService: ManualRuleService) {
    try {
      const { action, value, collection_id, username, uid, ref } = job.data;
      const data: IManualRule = { action, value, collection_id, username, uid, ref };
      await manualRuleService.executeRule(data);
      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: DOVECOT_LINKED_MAIL_COLLECTION,
        jobName: job.jobName,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}