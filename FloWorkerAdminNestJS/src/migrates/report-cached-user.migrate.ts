import { QueueName } from '../commons/constants/queues.contanst';
import { Graylog } from '../configs/graylog.config';
import { ReportCachedUserJob } from '../workers/report-cached-user.worker/jobs/report-cached-user.job';

export class ReportCachedUserMigrate {
  private readonly reportCachedUserJob: ReportCachedUserJob;
  constructor() {
    this.reportCachedUserJob = new ReportCachedUserJob();
    this.syncData();
  }

  async syncData() {
    try {
      await this.reportCachedUserJob.syncData();
      process.exit();
    } catch (error) {
      Graylog.getInstance().SendLog({
        moduleName: QueueName.REPORT_CACHED_USER_QUEUE,
        message: `ERROR: ${QueueName.REPORT_CACHED_USER_QUEUE} SYNC DATA`,
        fullMessage: error.message
      });
      throw error;
    }
  }
}
// tslint:disable-next-line: no-unused-expression
new ReportCachedUserMigrate();
