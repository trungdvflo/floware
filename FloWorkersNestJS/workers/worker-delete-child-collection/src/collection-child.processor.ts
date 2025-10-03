import {
    Process,
    Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { WORKER_CHILD_COLLECTION } from '../../common/constants/worker.constant';
import { Graylog } from '../../common/utils/graylog';
import { CollectionChildService } from './collection-child.service';

@Processor(WORKER_CHILD_COLLECTION.QUEUE)
export class CollectionChildProcessor {
  constructor(private readonly collectionChildService: CollectionChildService) {}

  @Process({
    name: WORKER_CHILD_COLLECTION.DELETE_CHILD_JOB.NAME,
    concurrency: WORKER_CHILD_COLLECTION.DELETE_CHILD_JOB.CONCURRENCY
  })
  async collectionChildHandler(job: Job): Promise<void> {
    this.handlerDeleteCollectionChild(job);
  }

  async handlerDeleteCollectionChild(job: Job) {
    try {
      this.collectionChildService.handleDeleteCollectionChild(job.data);
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