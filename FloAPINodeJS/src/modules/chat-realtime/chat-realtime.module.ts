import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoggerModule } from '../../common/logger/logger.module';
import {
  CollectionRepository, ConferenceMemberRepository, ConferenceRepository,
  FileCommonRepository,
  LinkFileRepository, QuotaRepository, ShareMemberRepository
} from '../../common/repositories';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue';
import { ChimeChatService, RealTimeService } from '../communication/services';
import { ChatController } from './chat-realtime.controller';
import { ChatService } from './chat-realtime.service';

@Module({
  imports: [
    LoggerModule,
    BullMqQueueModule,
    HttpModule,
    JwtModule,
    TypeOrmExModule.forCustomRepository([
      LinkFileRepository,
      ConferenceRepository,
      ConferenceMemberRepository,
      CollectionRepository,
      ShareMemberRepository,
      FileCommonRepository,
      QuotaRepository,
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChimeChatService, RealTimeService],
  exports: [ChatService],
})
export class ChatModule { }
