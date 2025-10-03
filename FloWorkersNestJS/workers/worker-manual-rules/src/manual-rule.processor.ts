import {
    Process,
    Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { Graylog } from '../../common/utils/graylog';
import {
    DOVECOT_LINKED_MAIL_COLLECTION,
    DOVECOT_LINKED_MAIL_COLLECTION_JOB
} from '../common/constants/worker.constant';
import { IManualRule } from '../common/interfaces/manual-rule.interface';
import { ManualRuleService } from './manual-rule.service';

@Processor(DOVECOT_LINKED_MAIL_COLLECTION)
export class ManualRuleProcessor {
  constructor(private readonly manualRuleService: ManualRuleService) {}

  @Process(
    { name: DOVECOT_LINKED_MAIL_COLLECTION_JOB.NAME,
      concurrency: DOVECOT_LINKED_MAIL_COLLECTION_JOB.CONCURRENCY
    })
  async manualRulesHandler(job: Job): Promise<void> {
    this.handlerManualRule(job);
  }

  async handlerManualRule(job: Job) {
    try {
      const { action, value, collection_id, username, uid, ref } = job.data;
      const data: IManualRule = { action, value, collection_id, username, uid, ref };
      return await this.manualRuleService.executeRule(data);
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: DOVECOT_LINKED_MAIL_COLLECTION,
        jobName: DOVECOT_LINKED_MAIL_COLLECTION_JOB.NAME,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}