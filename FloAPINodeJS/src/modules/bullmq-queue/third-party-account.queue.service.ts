import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { QueueName } from '../../common/constants';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import rabbitmqConfig from '../../configs/rabbitmq.config';

export type IThirdPartyAccountJob = { name: string, ids: number[] };
@Injectable()
export class ThirdPartyQueueService {
  private readonly rabbitMQQueueService: RabbitMQQueueService;
  constructor(
    @InjectQueue(QueueName().THIRD_PARTY_ACCOUNT_QUEUE)
    private readonly thirdPartyChildQueue: Queue,
  ) {
    this.rabbitMQQueueService = new RabbitMQQueueService({
      name: QueueName().THIRD_PARTY_ACCOUNT_QUEUE,
    });
  }

  /**
   * Children Adds an array of jobs to the queue.
   * @param name string
   * @param entity {user_id, id third party account}
   */
  async addJob(entity: IThirdPartyAccountJob[], user_id: number) {
    try {
      // adds child jobs
      if (rabbitmqConfig().enable) {
        const childrens = entity.map(child => {
          child['user_id'] = user_id;
          this.rabbitMQQueueService.addJob(`${child.name}`,
            child
          );
          return child;
        });
        return childrens;
      } else {
        const childrens = entity.map(child => {
          child['user_id'] = user_id;
          this.thirdPartyChildQueue.add(`${child.name}`,
            child
          );
          return child;
        });
        return childrens;
      }
    } catch (e) {
      return e;
    }
  }
}