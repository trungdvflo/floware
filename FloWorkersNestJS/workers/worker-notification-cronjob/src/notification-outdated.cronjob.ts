import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import cronjobConfig from '../../common/configs/cronjob.config';
import { WORKER_INVALID_FLO_OBJECT_COLLECTOR } from '../../common/constants/worker.constant';
import { Graylog } from '../../common/utils/graylog';
import { CollectionNotificationService } from './collection-notification.service';

const cronStatus = { isRunning: false };
@Injectable()
export class NotificationCronJob {
  constructor(private readonly notiService: CollectionNotificationService) {
    this.startCronJob();
  }

  async startCronJob() {
    try {
      await this.notiService.scanOutdatedNotification();
      return;
      const cronJob = new CronJob({
        cronTime: cronjobConfig().collectOutdatedNotificationCronTime,
        onTick: async () => {
          if (cronStatus.isRunning) return;
          cronStatus.isRunning = true;
          try {
            await this.notiService.scanOutdatedNotification();
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
