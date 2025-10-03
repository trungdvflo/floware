import { Injectable } from '@nestjs/common';
import { CollectionNotificationRepository } from 'workers/common/repository/collection-notification.repository';
import { NOTIFICATION_OUTDATED_CLEANER } from '../../common/constants/worker.constant';
import { IOutdatedNotification } from '../../common/interface/invalid-data.interface';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';

@Injectable()
export class OutdatedNotificationDeletionService {
  constructor(
    private readonly notiRepo: CollectionNotificationRepository,
    private readonly rabbitService: RabbitMQQueueService
  ) {
    this.rabbitService = new RabbitMQQueueService(
      { name: NOTIFICATION_OUTDATED_CLEANER.QUEUE });
  }

  async deleteOutdatedNotification({
    id,
    user_id
  }: IOutdatedNotification): Promise<number> {
    try {
      if (id > 0 && user_id > 0) {
        return await this.notiRepo.workerDeleteNotification(id, user_id);
      }
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: NOTIFICATION_OUTDATED_CLEANER.QUEUE,
        jobName: NOTIFICATION_OUTDATED_CLEANER.JOB.NAME,
        message: error.code,
        fullMessage: error.message
      });
      return 0;
    }
  }

}