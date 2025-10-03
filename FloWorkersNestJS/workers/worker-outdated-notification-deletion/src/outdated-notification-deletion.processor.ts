import { Injectable } from '@nestjs/common';
import { NOTIFICATION_OUTDATED_CLEANER } from '../../common/constants/worker.constant';
import { IOutdatedNotification } from '../../common/interface/invalid-data.interface';
import { JobMQ, RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { Graylog } from '../../common/utils/graylog';
import { OutdatedNotificationDeletionService } from './outdated-notification-deletion.service';

@Injectable()
export class OutdatedNotificationDeletionProcessor {
  private readonly rabbitMQQueue: RabbitMQQueueService;
  constructor(private readonly notificationService: OutdatedNotificationDeletionService) {
    this.rabbitMQQueue = new RabbitMQQueueService({
      name: NOTIFICATION_OUTDATED_CLEANER.QUEUE,
      concurrency: NOTIFICATION_OUTDATED_CLEANER.CONCURRENCY,
    });
    this.rabbitMQQueue.addProcessor(
      this.process, this.notificationService);
  }

  async process(job: JobMQ, notificationService: OutdatedNotificationDeletionService) {
    try {
      const jobData: IOutdatedNotification[] = !Array.isArray(job.data) ? [job.data] : job.data;
      for (const noti of jobData) {
        await notificationService.deleteOutdatedNotification(noti);
      }

      return true;
    } catch (err) {
      Graylog.getInstance().logInfo({
        moduleName: NOTIFICATION_OUTDATED_CLEANER.QUEUE,
        jobName: job.jobName,
        message: err.code,
        fullMessage: err.message
      });
      return err;
    }
  }

}