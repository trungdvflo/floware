import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { QueueName } from '../../common/constants/queue.constant';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import rabbitmqConfig from '../../configs/rabbitmq.config';

@Injectable()
export class SortObjectQueueService {
  private readonly rabbitSortObject: RabbitMQQueueService;
  private readonly rabbitResetOrder: RabbitMQQueueService;
  constructor (
    @InjectQueue(QueueName().SORT_OBJECT_QUEUE)
    private readonly sortObjectQueue: Queue,
    @InjectQueue(QueueName().RESET_ORDER_QUEUE)
    private readonly resetOrderQueue: Queue
  ) {
    this.rabbitSortObject = new RabbitMQQueueService({
      name: QueueName().SORT_OBJECT_QUEUE,
    });
    this.rabbitResetOrder = new RabbitMQQueueService({
      name: QueueName().RESET_ORDER_QUEUE,
    });
  }

  async addSortObjectJob(apiName: string, queueMsg) {
    try {
      if (rabbitmqConfig().enable) {
        return await this.rabbitSortObject.addJob(apiName, queueMsg);
      } else {
        return await this.sortObjectQueue.add(apiName, queueMsg);
      }
    } catch (error) {
      return false;
    }
  }

  async addResetOrderJob(apiName: string, queueMsg) {
    try {
      if (rabbitmqConfig().enable) {
        return await this.rabbitResetOrder.addJob(apiName, queueMsg);
      } else {
        return await this.resetOrderQueue.add(apiName, queueMsg);
      }
    } catch (error) {
      throw error;
    }
  }
}