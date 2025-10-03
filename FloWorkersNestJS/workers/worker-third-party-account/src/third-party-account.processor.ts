import {
  Process,
  Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { WORKER_THIRD_PARTY_ACCOUNT } from '../../common/constants/worker.constant';
import { Graylog } from '../../common/utils/graylog';
import { ThirdPartyAccountService } from './third-party-account.service';

@Processor(WORKER_THIRD_PARTY_ACCOUNT.QUEUE)
export class ThirdPartyAccountProcessor {
  constructor(private readonly thirdPartyAccountService: ThirdPartyAccountService) { }

  @Process({
    name: WORKER_THIRD_PARTY_ACCOUNT.JOB.NAME.COLLECTION_LINK,
    concurrency: WORKER_THIRD_PARTY_ACCOUNT.JOB.CONCURRENCY
  })
  async deleteLinkedCollectionObject(job: Job): Promise<string> {
    try {
      const { user_id, email, ids } = job.data;
      if (!user_id || !ids || ids.length === 0) {
        throw Error('Job data invalid: ' + JSON.stringify(job.data));
      }
      await this.thirdPartyAccountService.deleteLinkedCollectionObject(user_id, email, ids);
      return 'Done';
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_THIRD_PARTY_ACCOUNT.QUEUE,
        jobName: job.name,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

  @Process({
    name: WORKER_THIRD_PARTY_ACCOUNT.JOB.NAME.RECENT_OBJ,
    concurrency: WORKER_THIRD_PARTY_ACCOUNT.JOB.CONCURRENCY
  })
  async deleteRecentObject(job: Job): Promise<string> {
    try {
      const { user_id, email, ids } = job.data;
      if (!user_id || !ids || ids.length === 0) {
        throw Error('Job data invalid: ' + JSON.stringify(job.data));
      }
      await this.thirdPartyAccountService.deleteRecentObject(user_id, email, ids);
      return 'Done';
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_THIRD_PARTY_ACCOUNT.QUEUE,
        jobName: 'deleteRecentObject',
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

  // LINK: 'LINK',
  @Process({
    name: WORKER_THIRD_PARTY_ACCOUNT.JOB.NAME.LINK,
    concurrency: WORKER_THIRD_PARTY_ACCOUNT.JOB.CONCURRENCY
  })
  async deleteLinkedObject(job: Job): Promise<string> {
    try {
      const { user_id, email, ids } = job.data;
      if (!user_id || !ids || ids.length === 0) {
        throw Error('Job data invalid: ' + JSON.stringify(job.data));
      }
      await this.thirdPartyAccountService.deleteLinkedObject(user_id, email, ids);
      return 'Done';
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_THIRD_PARTY_ACCOUNT.QUEUE,
        jobName: 'deleteLinkedObject',
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

  @Process({
    name: WORKER_THIRD_PARTY_ACCOUNT.JOB.NAME.ORDER_OBJ,
    concurrency: WORKER_THIRD_PARTY_ACCOUNT.JOB.CONCURRENCY
  })
  async deleteSortObject(job: Job): Promise<string> {
    try {
      const { user_id, email, ids } = job.data;
      if (!user_id || !ids || ids.length === 0) {
        throw Error('Job data invalid: ' + JSON.stringify(job.data));
      }
      await this.thirdPartyAccountService.deleteSortObject(user_id, email, ids);
      return 'Done';
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_THIRD_PARTY_ACCOUNT.QUEUE,
        jobName: 'deleteSortObject',
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

  @Process({
    name: WORKER_THIRD_PARTY_ACCOUNT.JOB.NAME.HISTORY,
    concurrency: WORKER_THIRD_PARTY_ACCOUNT.JOB.CONCURRENCY
  })
  async deleteContactHistory(job: Job): Promise<string> {
    try {
      const { user_id, email, ids } = job.data;
      if (!user_id || !ids || ids.length === 0) {
        throw Error('Job data invalid: ' + JSON.stringify(job.data));
      }
      await this.thirdPartyAccountService.deleteContactHistory(user_id, email, ids);
      return 'Done';
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_THIRD_PARTY_ACCOUNT.QUEUE,
        jobName: 'deleteContactHistory',
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

  @Process({
    name: WORKER_THIRD_PARTY_ACCOUNT.JOB.NAME.TRACK,
    concurrency: WORKER_THIRD_PARTY_ACCOUNT.JOB.CONCURRENCY
  })
  async deleteEmailTracking(job: Job): Promise<string> {
    try {
      const { user_id, email, ids } = job.data;
      if (!user_id || !ids || ids.length === 0) {
        throw Error('Job data invalid: ' + JSON.stringify(job.data));
      }
      await this.thirdPartyAccountService.deleteEmailTracking(user_id, email, ids);
      return 'Done';
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_THIRD_PARTY_ACCOUNT.QUEUE,
        jobName: 'deleteEmailTracking',
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

  @Process({
    name: WORKER_THIRD_PARTY_ACCOUNT.JOB.NAME.CANVAS,
    concurrency: WORKER_THIRD_PARTY_ACCOUNT.JOB.CONCURRENCY
  })
  async deleteKanbanCard(job: Job): Promise<string> {
    try {
      const { user_id, email, ids } = job.data;
      if (!user_id || !ids || ids.length === 0) {
        throw Error('Job data invalid: ' + JSON.stringify(job.data));
      }
      await this.thirdPartyAccountService.deleteKanbanCard(user_id, email, ids);
      return 'Done';
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_THIRD_PARTY_ACCOUNT.QUEUE,
        jobName: 'deleteKanbanCard',
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}