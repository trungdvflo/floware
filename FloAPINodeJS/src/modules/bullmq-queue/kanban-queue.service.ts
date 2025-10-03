import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { QueueName } from '../../common/constants';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import rabbitmqConfig from '../../configs/rabbitmq.config';

export enum KanbanJobNames {
  DELETE_KANBAN = 'deleteKanban'
}

@Injectable()
export class KanbanQueueService {
  private readonly rabbitMQQueueService: RabbitMQQueueService;
  constructor (
    @InjectQueue(QueueName().KANBAN_QUEUE)
    private readonly kanbanQueue: Queue
  ) {
    this.rabbitMQQueueService = new RabbitMQQueueService({
      name: QueueName().KANBAN_QUEUE,
    });
  }

  async deleteKanban(userId: number, kanbanIds: number[]) {
    if (rabbitmqConfig().enable) {
      return await this.rabbitMQQueueService.addJob(KanbanJobNames.DELETE_KANBAN, {
        userId,
        kanbanIds
      });
    } else {
      return await this.kanbanQueue.add(KanbanJobNames.DELETE_KANBAN, {
        userId,
        kanbanIds
      });
    }
  }
}