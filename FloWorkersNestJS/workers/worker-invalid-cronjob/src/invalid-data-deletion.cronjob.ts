import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import cronjobConfig from '../../common/configs/cronjob.config';
import { WORKER_INVALID_DATA_DELETION } from '../../common/constants/worker.constant';
import { Graylog } from '../../common/utils/graylog';
import { InvalidCronjobService } from './invalid-cronjob.service';

const cronStatus = { isRunning: false };
@Injectable()
export class InvalidDataDeletionCronJob {
  constructor(private readonly invalidCronjobService: InvalidCronjobService) {
    this.startCronJob();
  }

  async startCronJob() {
    try {
      // await this.invalidCronjobService.collectToQueueToCleanInvalidData();
      // return;
      const cronJob = new CronJob({
        cronTime: cronjobConfig().cronTimeDeleteInvalidDataCronTime,
        onTick: async () => {
          if (cronStatus.isRunning) return;
          cronStatus.isRunning = true;
          try {
            await this.invalidCronjobService.collectToQueueToCleanInvalidData();
          } finally {
            cronStatus.isRunning = false;
          }
        }
      });
      cronJob.start();
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_INVALID_DATA_DELETION.QUEUE,
        message: `ERROR: ${WORKER_INVALID_DATA_DELETION.NAME}`,
        fullMessage: err.message,
      });
      return err;
    }
  }
}
