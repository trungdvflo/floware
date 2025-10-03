import { BullModule } from '@nestjs/bull';
import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import rabbitmqConfig from '../../common/configs/rabbitmq.config';
import { WORKER_OBJECT } from '../../common/constants/worker.constant';
import {
    ApiLastModifiedCommonModule
} from '../../common/modules/last-modified/api-last-modify-common.module';
import {
    CalendarObjectsRepository
} from '../../common/repository/calendar-objects.repository';
import { CloudRepository } from '../../common/repository/cloud.repository';
import {
    DeleteItemRepository
} from '../../common/repository/delete-item.repository';
import {
    KanbanCardRepository
} from '../../common/repository/kanban-card.repository';
import {
    KanbanRepository
} from '../../common/repository/kanban.repository';
import {
    SortObjectRepository
} from '../../common/repository/sort-object.repository';
import {
    ThirdPartyAccountRepository
} from '../../common/repository/third-party-account.repository';
import { UrlRepository } from '../../common/repository/url.repository';
import { UserRepository } from '../../common/repository/user.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { ObjectService } from './object.service';
import { ResetObjectRabbitMQProcessor } from './reset-object-rabbitmq.processor';
import { ResetObjectProcessor } from './reset-object.processor';
import { SortObjectRabbitMQProcessor } from './sort-object-rabbitmq.processor';
import { SortObjectProcessor } from './sort-object.processor';
import { SortObjectService } from './sort-object.service';
@Module({
  imports: [
    ConfigModule,
    ApiLastModifiedCommonModule,
    TypeORMModule.forCustomRepository([
      ThirdPartyAccountRepository,
      UserRepository,
      DeleteItemRepository,
      SortObjectRepository,
      CalendarObjectsRepository,
      KanbanRepository,
      KanbanCardRepository,
      UrlRepository,
      CloudRepository,
    ]),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      isGlobal: true,
      extraProviders: [],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('redis.host'),
        port: +configService.get('redis.port'),
        db: +configService.get('redis.db'),
        password: configService.get('redis.password'),
        tls: configService.get('redis.tls')
      }),
      inject: [ConfigService],
    }),
    TypeORMModule.forCustomRepository([

    ]),
    BullModule.registerQueueAsync(
      { name: rabbitmqConfig().enable ? null : WORKER_OBJECT.RESET_QUEUE },
      { name: rabbitmqConfig().enable ? null : WORKER_OBJECT.SORT_QUEUE },
    )
  ],
  providers: [
    ObjectService,
    SortObjectService,
    ...(rabbitmqConfig().enable
      ? [RabbitMQQueueService, ResetObjectRabbitMQProcessor, SortObjectRabbitMQProcessor]
      : [ResetObjectProcessor, SortObjectProcessor])
  ],
})
export class ObjectWorker { }
