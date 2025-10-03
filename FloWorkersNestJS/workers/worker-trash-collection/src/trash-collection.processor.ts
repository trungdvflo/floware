import {
  Process,
  Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { WORKER_TRASH } from '../../common/constants/worker.constant';
import { Graylog } from '../../common/utils/graylog';
import { TrashCollectionService } from './trash-collection.service';

@Processor(WORKER_TRASH.QUEUE)
export class TrashCollectionProcessor {
  constructor(private readonly trashService: TrashCollectionService) { }

  @Process({
    concurrency: WORKER_TRASH.JOB.CONCURRENCY,
    name: WORKER_TRASH.JOB.NAME.TRASH_AFTER_CREATE
  })
  async handleAfterInsert(job: Job): Promise<string> {
    try {
      const jobData = this.cookJobData(job);
      await Promise.all(jobData.map(trash => {
        this.trashService.handleAfterInsert(trash);
      }));
      return 'Done';
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_TRASH.QUEUE,
        jobName: 'handleAfterInsert',
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

  @Process({
    concurrency: WORKER_TRASH.JOB.CONCURRENCY,
    name: WORKER_TRASH.JOB.NAME.TRASH_AFTER_DELETE
  })
  async handleAfterDelete(job: Job): Promise<string> {
    try {
      const jobData = this.cookJobData(job);
      await Promise.all(jobData.map(trash => {
        this.trashService.handleAfterDelete(trash);
      }));
      return 'Done';
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_TRASH.QUEUE,
        jobName: 'handleAfterDelete',
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

  @Process({
    concurrency: WORKER_TRASH.JOB.CONCURRENCY,
    name: WORKER_TRASH.JOB.NAME.TRASH_AFTER_RECOVER
  })
  async handleAfterRecover(job: Job): Promise<string> {
    try {
      const jobData = this.cookJobData(job);
      await Promise.all(jobData.map(trash => {
        this.trashService.handleAfterRecover(trash);
      }));
      return 'Done';
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_TRASH.QUEUE,
        jobName: 'handleAfterRecover',
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

  cookJobData(job: Job): any[] {
    if (!job.data || (Array.isArray(job.data) && !job.data.length)) {
      throw Error('Job data invalid: ' + JSON.stringify(job.data));
    }
    return Array.isArray(job.data) ? job.data : [job.data.entity];
  }
}