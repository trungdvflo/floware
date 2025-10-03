import {
  OnQueueFailed,
  OnQueueStalled,
  Process,
  Processor
} from '@nestjs/bull';
import { Job } from 'bull';
import { WORKER_COLLECTION } from '../../common/constants/worker.constant';
import { ICollection } from '../../common/interface/collection.interface';
import { Graylog } from '../../common/utils/graylog';
import { CollectionService } from './collection.service';

@Processor(WORKER_COLLECTION.QUEUE)
export class CollectionProcessor {
  constructor(private readonly collectionService: CollectionService) { }

  @Process({
    name: WORKER_COLLECTION.COLLECTION_TREE_JOB.NAME,
    concurrency: WORKER_COLLECTION.COLLECTION_TREE_JOB.CONCURRENCY
  })
  async collectionHandler(job: Job): Promise<boolean> {
    return this.handlerDeleteCollectionTree(job);
  }

  @OnQueueStalled()
  onStalled(job: Job<any>) {
    Graylog.getInstance().logInfo({
      moduleName: WORKER_COLLECTION.QUEUE,
      jobName: WORKER_COLLECTION.COLLECTION_TREE_JOB.NAME,
      message: job.failedReason,
      fullMessage: `Stalled job ${job.id}: ${job.failedReason}`
    });
  }

  @OnQueueFailed()
  onError(job: Job<any>, error) {
    Graylog.getInstance().logInfo({
      moduleName: WORKER_COLLECTION.QUEUE,
      jobName: WORKER_COLLECTION.COLLECTION_TREE_JOB.NAME,
      message: error.message,
      fullMessage: `Failed job ${job.id}: ${error.message}`
    });
  }

  async handlerDeleteCollectionTree(job: Job) {
    try {
      const { userId, email, collectionIds } = job.data;
      const data: ICollection = {
        user_id: userId,
        email,
        collection_ids: collectionIds
      };
      await this.collectionService.handleDeleteCollection(data);
      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_COLLECTION.QUEUE,
        jobName: WORKER_COLLECTION.COLLECTION_TREE_JOB.NAME,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }
}