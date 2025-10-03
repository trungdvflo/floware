import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChimeChatChannelEntity } from '../../common/entities/chime-chat-channel.entity';
import { ConferenceHistoryEntity } from '../../common/entities/conference-history.entity';
import {
  ConferenceHistoryRepository, ConferenceMeetingRepository,
  ConferenceRepository, DeviceTokenRepository
} from '../../common/repositories';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { BullMqSocketModule } from '../bullmq-queue/bullmq-socket.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { UsersModule } from '../users/users.module';
import { ConferenceInviteController } from './conference-invite.controller';
import { ConferenceInviteRealtimeService } from './conference-invite.realtime.service';
import { ConferenceInviteService } from './conference-invite.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      ConferenceHistoryEntity,
      ChimeChatChannelEntity,
    ]),
    TypeOrmExModule.forCustomRepository([
      DeviceTokenRepository,
      ConferenceHistoryRepository,
      ConferenceRepository,
      ConferenceMeetingRepository
    ]),
    HttpModule,
    UsersModule,
    DeletedItemModule,
    DatabaseModule,
    BullMqQueueModule,
    BullMqSocketModule
  ],
  controllers: [ConferenceInviteController],
  providers: [ConferenceInviteService, ConferenceInviteRealtimeService],
  exports: [ConferenceInviteService, ConferenceInviteRealtimeService]
})
export class ConferenceInviteModule { }
