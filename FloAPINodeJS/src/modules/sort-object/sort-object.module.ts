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
import { SortObjectRepository } from '../../common/repositories/sort-object.repository';
import { ThirdPartyAccountRepo } from '../../common/repositories/third-party-account.repository';
import { UrlRepository } from '../../common/repositories/url.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import appConfig from '../../configs/app';
import cfgRedis from '../../configs/redis';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { ThirdPartyAccountModule } from '../third-party-account/third-party-account.module';
import { SortObjectController } from './sort-object.controller';
import { SortObjectService } from './sort-object.service';
@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        CalendarObjects,
        SortObject,
        Cloud,
        Kanban,
        KanbanCard,
      ]),
    TypeOrmExModule.forCustomRepository([
      SortObjectRepository,
      ThirdPartyAccountRepo,
      UrlRepository
    ]),
    DeletedItemModule,
    LoggerModule,
    ThirdPartyAccountModule,
    BullMqQueueModule,
    DatabaseModule,
    ConfigModule.forFeature(cfgRedis),
    CacheModule.registerAsync({
      imports: [ConfigModule.forFeature(appConfig)],
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
    }),
    BullMqQueueModule
  ],
  controllers: [SortObjectController],
  exports: [SortObjectService],
  providers: [SortObjectService]
})

export class SortObjectsModule {}
