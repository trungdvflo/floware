import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import rabbitmqConfig from '../../common/configs/rabbitmq.config';
import { WORKER_CHILD_COLLECTION, WORKER_COLLECTION } from '../../common/constants/worker.constant';
import { ApiLastModifiedCommonModule } from '../../common/modules/last-modified/api-last-modify-common.module';
import { CollectionActivityRepository } from '../../common/repository/collection-activity.repository';
import { CollectionNotificationRepository } from '../../common/repository/collection-notification.repository';
import { CollectionShareMemberRepository } from '../../common/repository/collection-share-member.repository';
import { CollectionRepository } from '../../common/repository/collection.repository';
import { DeleteItemRepository } from '../../common/repository/delete-item.repository';
import { KanbanRepository } from '../../common/repository/kanban.repository';
import { LinksCollectionObjectRepository } from '../../common/repository/links-collection-object.repository';
import { SettingRepository } from '../../common/repository/setting.repository';
import { TrashRepository } from '../../common/repository/trash.repository';
import { UserRepository } from '../../common/repository/user.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { CollectionMemberProcessor } from './collection-member.processor';
import { CollectionRabbitMQProcessor } from './collection-rabbitmq.processor';
import { CollectionProcessor } from './collection.processor';
import { CollectionService } from './collection.service';

@Module({
  imports: [
    ConfigModule,
    ApiLastModifiedCommonModule,
    TypeORMModule.forCustomRepository([
      CollectionRepository,
      CollectionActivityRepository,
      LinksCollectionObjectRepository,
      DeleteItemRepository,
      CollectionShareMemberRepository,
      CollectionNotificationRepository,
      TrashRepository,
      UserRepository,
      KanbanRepository,
      SettingRepository
    ]),
    BullModule.registerQueueAsync(
      { name: (rabbitmqConfig().enable) ? null : WORKER_COLLECTION.QUEUE },
      { name: (rabbitmqConfig().enable) ? null : WORKER_CHILD_COLLECTION.QUEUE }
    )
  ],
  providers: [
    CollectionService,
    ...(rabbitmqConfig().enable
      ? [RabbitMQQueueService, CollectionRabbitMQProcessor]
      : [CollectionProcessor, CollectionMemberProcessor])
  ]
})
export class CollectionWorker { }
