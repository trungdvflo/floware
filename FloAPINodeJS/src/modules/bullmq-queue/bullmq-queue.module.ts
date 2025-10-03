import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueName } from '../../common/constants';
import { LoggerModule } from '../../common/logger/logger.module';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { ApiLastModifiedQueueService } from './api-last-modified-queue.service';
import { CalDavQueueService } from './caldav-queue.service';
import { CollectionQueueService } from './collection-queue.service';
import { DeleteObjectQueueService } from './delete-object-queue.service';
import { FileAttachmentQueueService } from './file-queue.service';
import { KanbanQueueService } from './kanban-queue.service';
import { SortObjectQueueService } from './sort-object-queue.service';
import { ThirdPartyQueueService } from './third-party-account.queue.service';
import { TrashQueueService } from './trash-queue.service';
@Module({
  imports: [
    HttpModule,
    LoggerModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          db: configService.get('redis.db'),
          password: configService.get('redis.password'),
          tls: configService.get('redis.tls')
        },
        defaultJobOptions: {
          removeOnComplete: configService.get('redis.removeOnComplete'),
          removeOnFail: configService.get('redis.removeOnFail')
        }
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: QueueName().API_LAST_MODIFIED_QUEUE,
      },
      {
        name: QueueName().COLLECTION_QUEUE
      },
      {
        name: QueueName().CALDAV_QUEUE
      },
      {
        name: QueueName().FILE_QUEUE
      },
      {
        name: QueueName().DELETE_OBJECT_QUEUE
      },
      {
        name: QueueName().KANBAN_QUEUE
      },
      {
        name: QueueName().THIRD_PARTY_ACCOUNT_QUEUE
      },
      {
        name: QueueName().SORT_OBJECT_QUEUE
      },
      {
        name: QueueName().RESET_ORDER_QUEUE
      },
      {
        name: QueueName().TRASH_QUEUE
      },
    )
  ],
  providers: [
    CollectionQueueService,
    CalDavQueueService,
    ApiLastModifiedQueueService,
    FileAttachmentQueueService,
    DeleteObjectQueueService,
    KanbanQueueService,
    ThirdPartyQueueService,
    SortObjectQueueService,
    TrashQueueService,
    RabbitMQQueueService
  ],
  exports: [
    CollectionQueueService,
    CalDavQueueService,
    ApiLastModifiedQueueService,
    FileAttachmentQueueService,
    DeleteObjectQueueService,
    KanbanQueueService,
    ThirdPartyQueueService,
    SortObjectQueueService,
    TrashQueueService,
  ],
})
export class BullMqQueueModule { }