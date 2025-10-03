import { Injectable } from '@nestjs/common';
import {
  NOTIFICATION_OUTDATED_CLEANER
} from '../../common/constants/worker.constant';
import { CollectionNotificationRepository } from '../../common/repository/collection-notification.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { sleep } from '../../common/utils/common';
import { Graylog } from '../../common/utils/graylog';
import { nLIMIT, nOFFSET } from '../../worker-invalid-data-deletion/commons/constant';

@Injectable()
export class CollectionNotificationService {
  constructor(
    private readonly notificationRepo: CollectionNotificationRepository,
    private readonly rabbitMQService: RabbitMQQueueService,

  ) {
    this.rabbitMQService = new RabbitMQQueueService(
      { name: NOTIFICATION_OUTDATED_CLEANER.QUEUE });
  }

  async scanOutdatedNotification(page = 0): Promise<number> {
    try {
      const limit = nLIMIT * 5;
      const listNotification = await this.notificationRepo
        .collectOutdatedCollectionNotification(nOFFSET, limit);

      if (!listNotification?.length) { return 0; }
      await this.rabbitMQService
        .addJob(NOTIFICATION_OUTDATED_CLEANER.JOB.NAME,
          listNotification);
      if (listNotification.length === limit) {
        // await sleep(50);
        page = page + 1;
        return await this.scanOutdatedNotification(page);
      }
      return listNotification.length;
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