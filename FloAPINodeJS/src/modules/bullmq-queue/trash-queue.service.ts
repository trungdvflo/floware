import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { QueueName, TRASH_TYPE } from '../../common/constants';
import { JobName } from '../../common/constants/job.constant';
import { TrashEntity } from '../../common/entities/trash.entity';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import rabbitmqConfig from '../../configs/rabbitmq.config';
@Injectable()
export class TrashQueueService {
  private readonly rabbitMQQueueService: RabbitMQQueueService;
  constructor (
    @InjectQueue(QueueName().TRASH_QUEUE)
    private readonly trashQueue: Queue,
  ) {
    this.rabbitMQQueueService = new RabbitMQQueueService({
      name: QueueName().TRASH_QUEUE,
    });
  }

  async afterCreated(entity: TrashEntity) {
    if (entity.object_type === TRASH_TYPE.EMAIL) {
      if (!entity["old_object_uid"]) {
        return;
      }
    }
    if (rabbitmqConfig().enable) {
      await this.rabbitMQQueueService.addJob(JobName.TRASH_AFTER_CREATE,
        {
          entity,
        });
    } else {
      await this.trashQueue.add(JobName.TRASH_AFTER_CREATE, { entity });
    }
  }

  async afterDeleted(entity: TrashEntity) {
    if (rabbitmqConfig().enable) {
      await this.rabbitMQQueueService.addJob(JobName.TRASH_AFTER_DELETE,
        {
          entity,
        });
    } else {
      await this.trashQueue.add(JobName.TRASH_AFTER_DELETE, { entity });
    }
  }

  async afterRecovered(entity: TrashEntity) {
    if (entity.object_type === TRASH_TYPE.EMAIL && !entity["new_object_uid"]) {
      return;
    }
    if (rabbitmqConfig().enable) {
      await this.rabbitMQQueueService.addJob(JobName.TRASH_AFTER_RECOVER,
        {
          entity,
        });
    } else {
      await this.trashQueue.add(JobName.TRASH_AFTER_RECOVER, { entity });
    }
  }
}