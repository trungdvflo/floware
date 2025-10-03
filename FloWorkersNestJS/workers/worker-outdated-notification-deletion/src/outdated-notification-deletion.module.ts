import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CollectionNotificationRepository } from 'workers/common/repository/collection-notification.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { OutdatedNotificationDeletionProcessor } from './outdated-notification-deletion.processor';
import { OutdatedNotificationDeletionService } from './outdated-notification-deletion.service';

@Module({
  imports: [
    ConfigModule,
    TypeORMModule.forCustomRepository([
      CollectionNotificationRepository
    ]),
  ],
  providers: [
    OutdatedNotificationDeletionService,
    RabbitMQQueueService,
    OutdatedNotificationDeletionProcessor
  ]
})
export class OutdatedNotificationWorker { }
