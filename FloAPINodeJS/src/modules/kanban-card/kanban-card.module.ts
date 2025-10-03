import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as redisStore from 'cache-manager-redis-store';
import { CalendarObjects } from '../../common/entities/calendar-objects.entity';
import { Cloud } from '../../common/entities/cloud.entity';
import { KanbanCard } from '../../common/entities/kanban-card.entity';
import { Kanban } from '../../common/entities/kanban.entity';
import { SortObject } from '../../common/entities/sort-object.entity';
import { LoggerModule } from '../../common/logger/logger.module';
import { KanbanCardRepository } from '../../common/repositories/kanban-card.repository';
import { SortObjectRepository } from '../../common/repositories/sort-object.repository';
import { UrlRepository } from '../../common/repositories/url.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import appConfig from '../../configs/app';
import cfgRedis from '../../configs/redis';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { CollectionModule } from '../collection/collection.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { KanbanModule } from '../kanban/kanban.module';
import { LinkedCollectionObjectModule } from '../link/collection/linked-collection-object.module';
import { SortObjectService } from '../sort-object/sort-object.service';
import { ThirdPartyAccountModule } from '../third-party-account/third-party-account.module';
import { TrashModule } from '../trash/trash.module';
import { KanbanCardController } from './kanban-card.controller';
import { KanbanCardService } from './kanban-card.service';

@Module({
  imports: [TypeOrmModule.forFeature([
      KanbanCard
      , SortObject
      , CalendarObjects
      , Cloud
      , Kanban
    ]),
    TypeOrmExModule.forCustomRepository([
      KanbanCardRepository,
      SortObjectRepository,
      UrlRepository,
    ]),
    DeletedItemModule,
    LoggerModule,
    KanbanModule,
    CollectionModule,
    DatabaseModule,
    ThirdPartyAccountModule,
    TrashModule,
    LinkedCollectionObjectModule,
    BullMqQueueModule,
  ConfigModule.forFeature(cfgRedis),
  CacheModule.registerAsync({
    imports: [ConfigModule.forFeature(appConfig)],
    isGlobal: true,
    extraProviders: [],
    useFactory: async (configService: ConfigService) => ({
      store: redisStore,
      host: configService.get('redis.host'),
      port: configService.get('redis.port'),
      db: configService.get('redis.db'),
      password: configService.get('redis.password'),
      tls: configService.get('redis.tls')
    }),
    inject: [ConfigService]
  })
  ],
  controllers: [KanbanCardController],
  providers: [KanbanCardService
    , SortObjectService
  ],
  exports: [KanbanCardService],
})
export class KanbanCardModule { }
