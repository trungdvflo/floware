import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { QueueName } from '../../common/constants/queue.constant';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import rabbitmqConfig from '../../configs/rabbitmq.config';

@Injectable()
export class CalDavQueueService {
  private readonly rabbitMQCalDavService: RabbitMQQueueService;
  constructor (
    @InjectQueue(QueueName().CALDAV_QUEUE)
    private readonly calDavQueue: Queue
  ) {
    this.rabbitMQCalDavService =
        new RabbitMQQueueService({
          name: QueueName().CALDAV_QUEUE,
        });
  }

  async addJob(
    jobName: string,
    input: {
      userId: number,
      data: {
        uid: string,
        calendarUri: string,
        oldCalendarUri?: string
      }[]
    }) {
      if (rabbitmqConfig().enable) {
        return await this.rabbitMQCalDavService.addJob(jobName, {
          userId: input.userId,
          data: input.data
        });
      } else {
        return await this.calDavQueue.add(jobName, {
          userId: input.userId,
          data: input.data
        });
      }
  }
}
