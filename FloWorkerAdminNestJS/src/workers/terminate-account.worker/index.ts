import { BaseWorker } from '../base-worker';
import { CronJob } from 'cron';

import { TERMINATE_CRONTIME } from '../../configs/cronjob.config';
import { TerminateAccountJob } from './jobs/terminate-account.job';
import { Graylog } from '../../configs/graylog.config';
import { QueueName } from '../../commons/constants/queues.contanst';

const cronStatus = { isRunning: false };
export class TerminateAccountWorker extends BaseWorker {
  private readonly terminateAccountJob: TerminateAccountJob;
  constructor() {
    const terminateAccountJob = new TerminateAccountJob();
    super(terminateAccountJob, null);
    this.terminateAccountJob = terminateAccountJob;
    this.pushChange();
  }

  async pushChange() {
    try {
      const CronPushChange = new CronJob({
        cronTime: TERMINATE_CRONTIME,
        onTick: async () => {
          if (cronStatus.isRunning) return;
          cronStatus.isRunning = true;
          await this.terminateAccountJob.CleanUserData(cronStatus);

          cronStatus.isRunning = false;
        }
      });
      CronPushChange.start();
    } catch (err) {
      Graylog.getInstance().SendLog({
        moduleName: QueueName.TERMINATE_ACCOUNT_QUEUE,
        message: `ERROR: ${QueueName.TERMINATE_ACCOUNT_QUEUE}`,
        fullMessage: err.message,
      });
      throw err;
    }
  }
}
// tslint:disable-next-line: no-unused-expression
new TerminateAccountWorker();
