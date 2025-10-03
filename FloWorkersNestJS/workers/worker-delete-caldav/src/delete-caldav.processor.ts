import {
    Process,
    Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { WORKER_CALDAV_QUEUE } from '../../common/constants/worker.constant';
import { Graylog } from '../../common/utils/graylog';
import { CaldavService } from './caldav.service';

@Processor(WORKER_CALDAV_QUEUE.QUEUE)
export class CaldavProcessor {
  constructor(private readonly caldavService: CaldavService) { }

  @Process({
    name: WORKER_CALDAV_QUEUE.CALDAV_JOB.NAME,
    concurrency: WORKER_CALDAV_QUEUE.CALDAV_JOB.CONCURRENCY
  })
  async deleteCaldavHandler(job: Job): Promise<boolean>  {
    return this.handlerDeleteCaldav(job);
  }

  async handlerDeleteCaldav(job: Job) {
    try {
      await this.caldavService.changeCalendarOfObjects(job.data);
      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_CALDAV_QUEUE.QUEUE,
        jobName: WORKER_CALDAV_QUEUE.CALDAV_JOB.NAME,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}