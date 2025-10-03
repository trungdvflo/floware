import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ChimeChatChannelEntity,
  ConferenceHistoryEntity,
  ConferenceMeetingEntity
} from '../../common/entities';
import {
  ConferenceHistoryRepository,
  ConferenceMeetingRepository,
  ConferenceMemberRepository,
  ConferenceRepository,
  DeviceTokenRepository
} from '../../common/repositories';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { ApiLastModifiedModule } from '../api-last-modified/api-last-modified.module';
import { BullMqQueueModule, BullMqSocketModule } from '../bullmq-queue';
import { ConferenceMemberModule } from '../conference-member/conference-member.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { UsersModule } from '../users/users.module';
import { ConferenceHistoryController } from './conference-history.controller';
import { ConferenceHistoryService } from './conference-history.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      ConferenceHistoryEntity,
      ChimeChatChannelEntity,
      ConferenceMeetingEntity
    ]),
    TypeOrmExModule.forCustomRepository([
      DeviceTokenRepository,
      ConferenceHistoryRepository,
      ConferenceRepository,
      ConferenceMemberRepository,
      ConferenceMeetingRepository
    ]),
    HttpModule,
    ConferenceMemberModule,
    ApiLastModifiedModule,
    UsersModule,
    DeletedItemModule,
    DatabaseModule,
    BullMqQueueModule,
    BullMqSocketModule
  ],
  controllers: [ConferenceHistoryController],
  providers: [ConferenceHistoryService],
  exports: [ConferenceHistoryService]
})
export class ConferenceHistoryModule { }
