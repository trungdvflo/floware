import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import cronjobConfig from '../../common/configs/cronjob.config';
import { WORKER_INVALID_FLO_OBJECT_COLLECTOR } from '../../common/constants/worker.constant';
import { Graylog } from '../../common/utils/graylog';
import { InvalidCronjobService } from './invalid-cronjob.service';

const cronStatus = { isRunning: false };
@Injectable()
export class InvalidFloObjectCronJob {
  constructor(private readonly invalidCronjobService: InvalidCronjobService) {
    this.startCronJob();
  }

  async startCronJob() {
    try {
      // await this.invalidCronjobService.scanObjectToMakeSureExisted();
      // return;
      const cronJob = new CronJob({
        cronTime: cronjobConfig().collectInvalidFloObjectCronTime,
        onTick: async () => {
          if (cronStatus.isRunning) return;
          cronStatus.isRunning = true;
          try {
            await this.invalidCronjobService.scanObjectToMakeSureExisted();
          } finally {
            cronStatus.isRunning = false;
          }
        }
      });
      cronJob.start();
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_INVALID_FLO_OBJECT_COLLECTOR.NAME,
        message: `ERROR: ${WORKER_INVALID_FLO_OBJECT_COLLECTOR.NAME}`,
        fullMessage: err.message,
      });
      return err;
    }
  }
}
