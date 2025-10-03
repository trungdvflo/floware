import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import cronjobConfig from '../../common/configs/cronjob.config';
import { Graylog } from '../../common/utils/graylog';
import { SubcriptionConst } from '../common/constants/worker.constant';
import { SubcriptionCronJobService } from './subscription.cronjob.service';

const cronStatus = { isRunning: false };
@Injectable()
export class SubcriptionCronJob {
  constructor(private readonly subcriptionService: SubcriptionCronJobService) {
    this.executeCron();
  }

  async executeCron() {
    try {
      const SUBSCRIPTION_CRONTIME = cronjobConfig().cronTimeSubScription;
      const CronPushChange = new CronJob({
        cronTime: SUBSCRIPTION_CRONTIME,
        onTick: async (): Promise<number> => {
          if (cronStatus.isRunning) return 0;
          cronStatus.isRunning = true;
          await this.subcriptionService.executeCron(cronStatus);

          cronStatus.isRunning = false;
          return 1;
        }
      });
      CronPushChange.start();
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: SubcriptionConst.MODULE_NAME,
        message: `ERROR: ${SubcriptionConst.MODULE_NAME}`,
        fullMessage: err.message,
      });
      return err;
    }
  }
}
