import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { CollectionJobName, QueueName } from '../../common/constants';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import rabbitmqConfig from '../../configs/rabbitmq.config';

@Injectable()
export class CollectionQueueService {
  private readonly rabbitMQCollectionService: RabbitMQQueueService;
  constructor (
      @InjectQueue(QueueName().COLLECTION_QUEUE)
      private readonly collectionQueue: Queue
    ) {
      this.rabbitMQCollectionService =
        new RabbitMQQueueService({
          name: QueueName().COLLECTION_QUEUE,
        });
    }

  async deleteCollection(userId: number, collectionId: number) {
    if (rabbitmqConfig().enable) {
      return await this.rabbitMQCollectionService.addJob(CollectionJobName.DELETE_COLLECTION, {
        userId,
        collectionId
      });
    } else {
      return await this.collectionQueue.add(CollectionJobName.DELETE_COLLECTION, {
        userId,
        collectionId
      });
    }
  }

  async deleteCollectionTree(userId: number, collectionIds: number[]) {
    if (rabbitmqConfig().enable) {
      return await this.rabbitMQCollectionService.addJob(CollectionJobName.DELETE_COLLECTION_TREE, {
        userId,
        collectionIds
      });
    } else {
      return await this.collectionQueue.add(CollectionJobName.DELETE_COLLECTION_TREE, {
        userId,
        collectionIds
      });
    }
  }

  async deleteCollectionOfMember(userId: number, collectionMemberIds: number[]) {
    if (rabbitmqConfig().enable) {
      return await this.rabbitMQCollectionService.addJob(
        CollectionJobName.DELETE_COLLECTION_MEMBER, {
        userId,
        collectionMemberIds
      });
    } else {
      return await this.collectionQueue.add(CollectionJobName.DELETE_COLLECTION_MEMBER, {
        userId,
        collectionMemberIds
      });
    }
  }
}