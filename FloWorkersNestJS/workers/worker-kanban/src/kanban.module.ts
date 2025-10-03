import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import rabbitmqConfig from '../../common/configs/rabbitmq.config';
import { WORKER_KANBAN } from '../../common/constants/worker.constant';
import { ApiLastModifiedCommonModule } from '../../common/modules/last-modified/api-last-modify-common.module';
import { CollectionRepository } from '../../common/repository/collection.repository';
import { DeleteItemRepository } from '../../common/repository/delete-item.repository';
import { KanbanCardRepository } from '../../common/repository/kanban-card.repository';
import { KanbanRepository } from '../../common/repository/kanban.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { DeleteKanbanRabbitMQProcessor } from './delete-kanban-rabbitmq.processor';
import { DeleteKanbanProcessor } from './delete-kanban.processor';
import { KanbanService } from './kanban.service';
import { SystemKanbanRabbitMQProcessor } from './system-kanban-rabbitmq.processor';
import { SystemKanbanProcessor } from './system-kanban.processor';
@Module({
  imports: [
    ConfigModule,
    ApiLastModifiedCommonModule,
    TypeORMModule.forCustomRepository([
      KanbanCardRepository,
      KanbanRepository,
      DeleteItemRepository,
      CollectionRepository
    ]),
    BullModule.registerQueueAsync(
      { name: rabbitmqConfig().enable ? null : WORKER_KANBAN.DELETE_QUEUE },
      { name: rabbitmqConfig().enable ? null : WORKER_KANBAN.CREATE_SYSTEM_QUEUE },
    )
  ],
  providers: [
    KanbanService,
    ...(rabbitmqConfig().enable
      ? [RabbitMQQueueService, DeleteKanbanRabbitMQProcessor, SystemKanbanRabbitMQProcessor]
      : [DeleteKanbanProcessor, SystemKanbanProcessor])
  ],
})
export class KanbanWorker { }
