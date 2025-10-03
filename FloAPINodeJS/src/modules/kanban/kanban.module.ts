import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarObjects } from '../../common/entities/calendar-objects.entity';
import { Cloud } from '../../common/entities/cloud.entity';
import { KanbanCard } from '../../common/entities/kanban-card.entity';
import { Kanban } from '../../common/entities/kanban.entity';
import { ShareMember } from '../../common/entities/share-member.entity';
import { SortObject } from '../../common/entities/sort-object.entity';
import { LoggerModule } from '../../common/logger/logger.module';
import { SortObjectRepository } from '../../common/repositories/sort-object.repository';
import { UrlRepository } from '../../common/repositories/url.repository';
import appConfig from '../../configs/app';
import cfgRedis from '../../configs/redis';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { CollectionModule } from '../collection/collection.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { SortObjectService } from '../sort-object/sort-object.service';
import { ThirdPartyAccountModule } from '../third-party-account/third-party-account.module';
import { KanbanController } from './kanban.controller';
import { KanbanService } from './kanban.service';
@Module({
  imports: [TypeOrmModule.forFeature([
    Kanban
    , SortObject
    , SortObjectRepository
    , CalendarObjects
    , UrlRepository
    , Cloud
    , KanbanCard
    , ShareMember
  ]),
    DeletedItemModule,
    LoggerModule,
    CollectionModule,
    ThirdPartyAccountModule,
    DatabaseModule,
    BullMqQueueModule,
  ConfigModule.forFeature(cfgRedis),
  BullModule.forRootAsync({
    imports: [ConfigModule.forFeature(appConfig)],
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
    inject: [ConfigService]
  })
  ],
  controllers: [KanbanController],
  providers: [KanbanService
    , SortObjectService
  ],
  exports: [KanbanService]
})
export class KanbanModule { }
