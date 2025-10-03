import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import rabbitmqConfig from '../../common/configs/rabbitmq.config';
import { WORKER_CALDAV_QUEUE, WORKER_CHILD_COLLECTION, WORKER_KANBAN } from '../../common/constants/worker.constant';
import { ApiLastModifiedCommonModule } from '../../common/modules/last-modified/api-last-modify-common.module';
import { CalendarInstanceRepository } from '../../common/repository/calendar-instance.repository';
import { CalendarRepository } from '../../common/repository/calendar.repository';
import { CollectionShareMemberRepository } from '../../common/repository/collection-share-member.repository';
import { CollectionRepository } from '../../common/repository/collection.repository';
import { DeleteItemRepository } from '../../common/repository/delete-item.repository';
import { EventRepository } from '../../common/repository/event.repository';
import { KanbanRepository } from '../../common/repository/kanban.repository';
import { LinksCollectionObjectRepository } from '../../common/repository/links-collection-object.repository';
import { NoteRepository } from '../../common/repository/note.repository';
import { SettingRepository } from '../../common/repository/setting.repository';
import { TodoRepository } from '../../common/repository/todo.repository';
import { TrashRepository } from '../../common/repository/trash.repository';
import { CommonCollectionService } from '../../common/services/collection.common.service';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { CollectionChildRabbitMQProcessor } from './collection-child-rabbitmq.processor';
import { CollectionChildProcessor } from './collection-child.processor';
import { CollectionChildService } from './collection-child.service';
@Module({
  imports: [
    ConfigModule,
    ApiLastModifiedCommonModule,
    TypeORMModule.forCustomRepository([
      CollectionRepository,
      LinksCollectionObjectRepository,
      DeleteItemRepository,
      CollectionShareMemberRepository,
      TrashRepository,
      KanbanRepository,
      TodoRepository,
      EventRepository,
      NoteRepository,
      SettingRepository,
      CalendarRepository,
      CalendarInstanceRepository
    ]),
    BullModule.registerQueueAsync(
      { name: rabbitmqConfig().enable ? null : WORKER_CHILD_COLLECTION.QUEUE },
      { name: rabbitmqConfig().enable ? null : WORKER_KANBAN.DELETE_QUEUE },
      { name: rabbitmqConfig().enable ? null : WORKER_CALDAV_QUEUE.QUEUE },
    )
  ],
  providers: [
    CollectionChildService,
    CommonCollectionService,
    ...(rabbitmqConfig().enable
      ? [RabbitMQQueueService, CollectionChildRabbitMQProcessor]
      : [CollectionChildProcessor])
  ]
})
export class ChildCollectionWorker { }
