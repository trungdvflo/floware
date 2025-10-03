import { Injectable } from '@nestjs/common';
import { CronJob } from 'cron';
import { RealtimeService } from './realtime.service';

@Injectable()
export class RealtimeCronJob {
  private cronPatterns = {
      reminder: process.env.REAL_TIME_CRON_PATTERN_MISS_CHAT || '*/1 * * * *'
  } ;
  constructor(private realtimeService: RealtimeService) {
    this.addAndStartCron();
  }

  async addAndStartCron() {
    const job = new CronJob(this.cronPatterns.reminder, async () => {
      await this.realtimeService.reminderMissMessage();
    });
    job.start();
  }
}
