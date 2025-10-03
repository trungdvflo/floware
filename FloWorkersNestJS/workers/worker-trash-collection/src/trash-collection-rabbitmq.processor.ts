import { Injectable } from '@nestjs/common';
import { WORKER_TRASH } from '../../common/constants/worker.constant';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { TrashCollectionService } from './trash-collection.service';

@Injectable()
export class TrashRabbitMQProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(
    private readonly trashService: TrashCollectionService,
  ) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: WORKER_TRASH.QUEUE,
      concurrency: WORKER_TRASH.JOB.CONCURRENCY,
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.trashService);
  }

  async process(job: JobMQ, trashService: TrashCollectionService) {
    try {
      // const trash: TrashEntity = job.data.entity;
      const jobData = cookJobData(job);
      if (job.jobName === WORKER_TRASH.JOB.NAME.TRASH_AFTER_CREATE) {
        await Promise.all(jobData.map(trash =>
          trashService.handleAfterInsert(trash)
        ));
      } else if (job.jobName === WORKER_TRASH.JOB.NAME.TRASH_AFTER_RECOVER) {
        await Promise.all(jobData.map(trash =>
          trashService.handleAfterRecover(trash)
        ));
      } else if (job.jobName === WORKER_TRASH.JOB.NAME.TRASH_AFTER_DELETE) {
        await Promise.all(jobData.map(trash =>
          trashService.handleAfterDelete(trash)
        ));
      }
      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_TRASH.QUEUE,
        jobName: job.jobName,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
    // tslint:disable-next-line: no-shadowed-variable
    function cookJobData(job: JobMQ): any[] {
      if (!job.data || (Array.isArray(job.data) && !job.data.length)) {
        throw Error('Job data invalid: ' + JSON.stringify(job.data));
      }
      return Array.isArray(job.data) ? job.data : [job.data.entity];
    }
  }

}