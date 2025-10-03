import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { OBJ_TYPE } from "../../common/constants";
import { JobName } from '../../common/constants/job.constant';
import { QueueName } from '../../common/constants/queue.constant';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import rabbitmqConfig from '../../configs/rabbitmq.config';

@Injectable()
export class DeleteObjectQueueService {
  private readonly rabbitMQQueueService: RabbitMQQueueService;
  constructor (
    @InjectQueue(QueueName().DELETE_OBJECT_QUEUE)
    private readonly deleteObjectQueue: Queue
  ) {
    this.rabbitMQQueueService = new RabbitMQQueueService({
      name: QueueName().DELETE_OBJECT_QUEUE,
    });
  }

  async addMultiJob(
    input: {
      userId: number;
      objectUids: string[],
      objectType: OBJ_TYPE
    }) {
    await input.objectUids.map(async item => {
      if (rabbitmqConfig().enable) {
        return await this.rabbitMQQueueService.addJob(JobName.DELETE_OBJECT, {
          userId: input.userId,
          objectUid: item,
          objectType: input.objectType
        });
      } else {
        return await this.deleteObjectQueue.add(JobName.DELETE_OBJECT, {
          userId: input.userId,
          objectUid: item,
          objectType: input.objectType
        });
      }
    });
  }

  async addJob(
    input: {
      userId: number;
      objectUid: string,
      objectType: OBJ_TYPE,
      objectId?: number
    }) {
    try {
      if (rabbitmqConfig().enable) {
        return await this.rabbitMQQueueService.addJob(JobName.DELETE_OBJECT, input);
      } else {
        return await this.deleteObjectQueue.add(JobName.DELETE_OBJECT, input);
      }
    } catch (error) {
      return false;
    }
  }
}