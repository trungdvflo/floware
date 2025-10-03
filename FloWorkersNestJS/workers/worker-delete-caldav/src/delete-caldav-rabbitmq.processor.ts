import { Injectable } from '@nestjs/common';
import { WORKER_CALDAV_QUEUE } from '../../common/constants/worker.constant';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { CaldavService } from './caldav.service';

@Injectable()
export class CaldavRabbitMQProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly caldavService: CaldavService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: WORKER_CALDAV_QUEUE.QUEUE,
      concurrency: WORKER_CALDAV_QUEUE.CALDAV_JOB.CONCURRENCY
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.caldavService);

  }

  async process (job: JobMQ, caldavService: CaldavService) {
    try {
      await caldavService.changeCalendarOfObjects(job.data);
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