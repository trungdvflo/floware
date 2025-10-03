import { Injectable } from '@nestjs/common';
import { WORKER_CHILD_COLLECTION } from '../../common/constants/worker.constant';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { CollectionChildService } from './collection-child.service';

@Injectable()
export class CollectionChildRabbitMQProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(
    private readonly collectionChildService: CollectionChildService,
  ) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: WORKER_CHILD_COLLECTION.QUEUE,
      concurrency: WORKER_CHILD_COLLECTION.DELETE_CHILD_JOB.CONCURRENCY
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.collectionChildService);
  }

  async process (job: JobMQ, collectionChildService: CollectionChildService) {
    try {
      await collectionChildService.handleDeleteCollectionChild(job.data);
      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_CHILD_COLLECTION.QUEUE,
        jobName: WORKER_CHILD_COLLECTION.DELETE_CHILD_JOB.NAME,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}