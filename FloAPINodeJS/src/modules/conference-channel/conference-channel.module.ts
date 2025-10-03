import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '../../common/logger/logger.module';
import {
  ConferenceMemberRepository,
  ConferenceRepository, MeetingRepository
} from '../../common/repositories';
import { ChimeMeetingRepository } from '../../common/repositories/chime-meeting.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { ChatModule } from '../chat-realtime/chat-realtime.module';
import { ChimeChatService } from '../communication/services';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { ConferencingController } from './conference-channel.controller';
import { ConferencingService } from './conference-channel.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmExModule.forCustomRepository([
      ConferenceRepository,
      ConferenceMemberRepository,
      MeetingRepository,
      ChimeMeetingRepository
    ]),
    DeletedItemModule,
    DatabaseModule,
    BullMqQueueModule,
    LoggerModule,
    ChatModule
  ],
  controllers: [ConferencingController],
  providers: [ConferencingService, ChimeChatService],
  exports: [ConferencingService],
})
export class ConferencingModule { }