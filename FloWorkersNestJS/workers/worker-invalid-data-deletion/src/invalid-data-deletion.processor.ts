import { Injectable } from '@nestjs/common';
import { WORKER_INVALID_DATA_DELETION } from '../../common/constants/worker.constant';
import { IObjectInvalid } from '../../common/interface/invalid-data.interface';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { InvalidDataDeletionService } from './invalid-data-deletion.service';

@Injectable()
export class InvalidLinkDeletionProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly invalidLinkService: InvalidDataDeletionService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: WORKER_INVALID_DATA_DELETION.QUEUE,
      concurrency: WORKER_INVALID_DATA_DELETION.CONCURRENCY,
    });
    this.rabbitMQQueue.addProcessor(
      this.process, this.invalidLinkService);
  }

  async process(job: JobMQ, invalidLinkService: InvalidDataDeletionService) {
    try {
      const jobData: IObjectInvalid[] = !Array.isArray(job.data) ? [job.data] : job.data;
      for (const invalidObj of jobData) {
        await invalidLinkService.deleteInvalidLink(invalidObj);
      }

      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_INVALID_DATA_DELETION.QUEUE,
        jobName: job.jobName,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

}