import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CollectionNotificationRepository } from '../../common/repository/collection-notification.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { CollectionNotificationService } from './collection-notification.service';
import { NotificationCronJob } from './notification-outdated.cronjob';
@Module({
  imports: [
    ConfigModule,
    TypeORMModule.forCustomRepository([
      CollectionNotificationRepository
    ]),
  ],
  providers: [
    NotificationCronJob,
    RabbitMQQueueService,
    CollectionNotificationService
  ]
})
export class AutoCleanNotification { }
