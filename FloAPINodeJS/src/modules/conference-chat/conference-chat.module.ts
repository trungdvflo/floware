import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { LoggerModule } from '../../common/logger/logger.module';
import { ShareMemberRepository } from '../../common/repositories';
import { ConferenceMemberRepository } from '../../common/repositories/conference-member.repository';
import { ConferenceChatRepository } from '../../common/repositories/conferencing-chat.repository';
import { FileCommonRepository } from '../../common/repositories/file-common.repository';
import { LinkFileRepository } from '../../common/repositories/link-file-common.repository';
import { QuotaRepository } from '../../common/repositories/quota.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { ChatModule } from '../chat-realtime/chat-realtime.module';
import { ChimeChatService } from '../communication/services';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { ConferenceChatController } from './conference-chat.controller';
import { ConferenceChatService } from './conference-chat.service';
@Module({
  imports: [
    HttpModule,
    BullMqQueueModule,
    TypeOrmExModule.forCustomRepository([
      FileCommonRepository,
      ConferenceMemberRepository,
      ConferenceChatRepository,
      LinkFileRepository,
      QuotaRepository,
      ShareMemberRepository
    ]),
    DatabaseModule,
    LoggerModule,
    DeletedItemModule,
    ChatModule
  ],
  providers: [ConferenceChatService, ChimeChatService],
  controllers: [ConferenceChatController],
  exports: [ConferenceChatService],
})
export class ConferenceChatModule {}