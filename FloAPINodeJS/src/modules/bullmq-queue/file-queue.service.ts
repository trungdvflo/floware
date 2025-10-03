import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { JobName, QueueName, SOURCE_TYPE_FILE_COMMON } from '../../common/constants';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import rabbitmqConfig from '../../configs/rabbitmq.config';

@Injectable()
export class FileAttachmentQueueService {
  private readonly rabbitMQQueueService: RabbitMQQueueService;
  constructor (
    @InjectQueue(QueueName().FILE_QUEUE)
    private readonly fileQueue: Queue
  ) {
    this.rabbitMQQueueService = new RabbitMQQueueService({
      name: QueueName().FILE_QUEUE,
    });
  }

  /**
   * add adds new job for contact worker
   * @param jobName
   * @param input
   * @returns
   */
  addJob(jobName: string, input: {
    userId: number,
    data: {
      uid: string,
      ext: string
    }
  }) {
    if (rabbitmqConfig().enable) {
      return this.rabbitMQQueueService.addJob(jobName, {
        userId: input.userId,
        data: input.data
      });
    } else {
      return this.fileQueue.add(jobName, {
        userId: input.userId,
        data: input.data
      });
    }
  }

  addJobFileCommon(input: {
    userId: number,
    data: {
      source_id: number,
      source_type: SOURCE_TYPE_FILE_COMMON,
      collection_id: number;
    }
  }) {
    if (rabbitmqConfig().enable) {
      return this.rabbitMQQueueService.addJob(JobName.DELETE_FILE_COMMONS, {
        userId: input.userId,
        data: input.data
      });
    } else {
      return this.fileQueue.add(JobName.DELETE_FILE_COMMONS, {
        userId: input.userId,
        data: input.data
      });
    }
  }
}
