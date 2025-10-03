
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { PUSH_CHANGE_CONFIG } from '../../common/constants/common.constant';
import { LIST_CRONJOB } from '../../common/constants/worker.constant';
import { TimestampDouble } from '../../common/utils/common';
import { Graylog } from '../../common/utils/graylog';
import { CommonService } from './common.service';

const cronStatus = { isRunning: false };
@Injectable()
export class PushChangeCronJob {
  constructor(
    private readonly commonService: CommonService,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly configService: ConfigService
  ) {
    this.addCronJob();
  }

  async addCronJob() {
    try {
      const { cronTime, overdueTime } = this.configService.get('cronjob');
      const job = new CronJob(cronTime, async () => {
        if (cronStatus.isRunning) return;
        cronStatus.isRunning = true;
        const pushChangeTime = TimestampDouble() - overdueTime;
        await this.commonService.pushChange(
          pushChangeTime,
          PUSH_CHANGE_CONFIG.OFFSET,
          PUSH_CHANGE_CONFIG.LIMIT
        );
        cronStatus.isRunning = false;
      });
      this.schedulerRegistry.addCronJob(LIST_CRONJOB.PUSH_CHANGE, job);
      job.start();
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: LIST_CRONJOB.PUSH_CHANGE,
        message: error.code,
        fullMessage: error.message
      });
      return error;
    }
  }
}