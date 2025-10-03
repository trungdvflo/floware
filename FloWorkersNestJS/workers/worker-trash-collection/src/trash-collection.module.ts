import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import rabbitmqConfig from '../../common/configs/rabbitmq.config';
import { WORKER_TRASH } from '../../common/constants/worker.constant';
import { ApiLastModifiedCommonModule } from '../../common/modules/last-modified/api-last-modify-common.module';
import { DeviceTokenRepository } from '../../common/repository/api-last-modify.repository';
import { CardContactRepository } from '../../common/repository/card-contact.repository';
import { CollectionShareMemberRepository } from '../../common/repository/collection-share-member.repository';
import { CollectionRepository } from '../../common/repository/collection.repository';
import { ContactHistoryRepository } from '../../common/repository/contact-history.repository';
import { DeleteItemRepository } from '../../common/repository/delete-item.repository';
import { EmailTrackingRepository } from '../../common/repository/email-tracking.repository';
import { EventRepository } from '../../common/repository/event.repository';
import { FileCommonRepository } from '../../common/repository/file-common.repository';
import { KanbanCardRepository } from '../../common/repository/kanban-card.repository';
import { LinkedFileCommonRepository } from '../../common/repository/link-file-common.repository';
import { LinksCollectionObjectRepository } from '../../common/repository/links-collection-object.repository';
import { LinksObjectRepository } from '../../common/repository/links-object.repository';
import { NoteRepository } from '../../common/repository/note.repository';
import { PushChangeRepository } from '../../common/repository/push-change.repository';
import { QuotaRepository } from '../../common/repository/quota.repository';
import { RecentObjectRepository } from '../../common/repository/recent-object.repository';
import { RuleRepository } from '../../common/repository/rule.repository';
import { SortObjectRepository } from '../../common/repository/sort-object.repository';
import { TodoRepository } from '../../common/repository/todo.repository';
import { TrashRepository } from '../../common/repository/trash.repository';
import { UrlRepository } from '../../common/repository/url.repository';
import { UserRepository } from '../../common/repository/user.repository';
import { WasabiService } from '../../common/services/handle-washabi.service';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { CommonService } from '../../worker-common/src/common.service';
import { TrashRabbitMQProcessor } from './trash-collection-rabbitmq.processor';
import { TrashCollectionProcessor } from './trash-collection.processor';
import { TrashCollectionService } from './trash-collection.service';
import { TrashUtil } from './trash-collection.util';
@Module({
  imports: [
    ConfigModule,
    ApiLastModifiedCommonModule,
    TypeORMModule.forCustomRepository([
      TrashRepository,
      KanbanCardRepository,
      CardContactRepository,
      EventRepository,
      NoteRepository,
      TodoRepository,
      LinksObjectRepository,
      LinksCollectionObjectRepository,
      ContactHistoryRepository,
      RecentObjectRepository,
      EmailTrackingRepository,
      DeleteItemRepository,
      UrlRepository,
      SortObjectRepository,
      CollectionRepository,
      CollectionShareMemberRepository,
      UserRepository,
      PushChangeRepository,
      DeviceTokenRepository,
      FileCommonRepository,
      LinkedFileCommonRepository,
      QuotaRepository,
      RuleRepository,
    ]),

    BullModule.registerQueueAsync(
      {
        name: rabbitmqConfig().enable ? null : WORKER_TRASH.QUEUE,
      }
    ),
  ],
  providers: [
    CommonService,
    WasabiService,
    TrashUtil,
    TrashCollectionService,
    ...(rabbitmqConfig().enable
      ? [TrashRabbitMQProcessor, RabbitMQQueueService]
      : [TrashCollectionProcessor]),
  ],
})
export class TrashCollectionWorker { }
