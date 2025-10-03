import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import rabbitmqConfig from '../../common/configs/rabbitmq.config';
import { ApiLastModifiedCommonModule } from '../../common/modules/last-modified/api-last-modify-common.module';
import { ContactHistoryRepository } from '../../common/repository/contact-history.repository';
import { DeleteItemRepository } from '../../common/repository/delete-item.repository';
import { FileAttachmentRepository } from '../../common/repository/file.repository';
import { KanbanCardRepository } from '../../common/repository/kanban-card.repository';
import { LinksCollectionObjectRepository } from '../../common/repository/links-collection-object.repository';
import { LinksObjectRepository } from '../../common/repository/links-object.repository';
import { RecentObjectRepository } from '../../common/repository/recent-object.repository';
import { SortObjectRepository } from '../../common/repository/sort-object.repository';
import { TrashRepository } from '../../common/repository/trash.repository';
import { UserRepository } from '../../common/repository/user.repository';
import { WasabiService } from '../../common/services/handle-washabi.service';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { LINK_OBJECT_QUEUE } from '../common/constants/worker.constant';
import { DeleteObjectRabbitMQProcessor } from './delete-object-rabbitmq.processor';
import { DeleteObjectProcessor } from './delete-object.processor';
import { LinksObjectService } from './links-object.service';
@Module({
  imports: [
    ConfigModule,
    ApiLastModifiedCommonModule,
    TypeORMModule.forCustomRepository([
      LinksObjectRepository,
      LinksCollectionObjectRepository,
      SortObjectRepository,
      RecentObjectRepository,
      DeleteItemRepository,
      ContactHistoryRepository,
      TrashRepository,
      FileAttachmentRepository,
      UserRepository,
      KanbanCardRepository
    ]),
    BullModule.registerQueueAsync(
      {
        name: rabbitmqConfig().enable ? null : LINK_OBJECT_QUEUE
      },
    )
  ],
  providers: [
    LinksObjectService,
    WasabiService,
    ...(rabbitmqConfig().enable
      ? [RabbitMQQueueService, DeleteObjectRabbitMQProcessor]
      : [DeleteObjectProcessor])
  ]
})
export class LinksObjectWorker { }
