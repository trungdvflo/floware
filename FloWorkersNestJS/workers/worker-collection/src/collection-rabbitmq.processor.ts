import { Injectable } from '@nestjs/common';
import { WORKER_COLLECTION } from '../../common/constants/worker.constant';
import { ICollection, ICollectionMember } from '../../common/interface/collection.interface';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { CollectionService } from './collection.service';

@Injectable()
export class CollectionRabbitMQProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly collectionService: CollectionService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: WORKER_COLLECTION.QUEUE,
      concurrency: WORKER_COLLECTION.COLLECTION_TREE_JOB.CONCURRENCY
    });

    this.rabbitMQQueue.addProcessor(
      this.process, this.collectionService);
  }

  async process(job: JobMQ, collectionService: CollectionService) {
    try {
      if (job.jobName === WORKER_COLLECTION.COLLECTION_TREE_JOB.NAME) {
        const { userId, email, collectionIds } = job.data;
        const data: ICollection = {
          user_id: userId,
          email,
          collection_ids: collectionIds
        };
        await collectionService.handleDeleteCollection(data);
        return true;
      } else if (job.jobName === WORKER_COLLECTION.COLLECTION_MEMBER_JOB.NAME) {
        const { userId, email, collectionMemberIds } = job.data;
        const data: ICollectionMember = {
          owner_id: userId,
          email,
          collection_member_ids: collectionMemberIds
        };
        if (collectionMemberIds.length > 0) {
          await collectionService.handleDeleteCollectionMember(data);
        }
        return true;
      }
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: WORKER_COLLECTION.QUEUE,
        jobName: job.jobName,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

}