import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RealTimeService } from 'modules/communication/services';
import { TypeOrmExModule } from 'modules/database/typeorm-ex.module';
import { TaskQueueModule } from 'modules/task-queue/task-queue.module';
import { ChimeChatMessagesRepo } from 'repositories/chime_chat_messages.repository';
import { ChimeChatChannelRepo } from '../../repositories/chime_chat_channel.repository';
import { ChimeChatChannelMemberRepo } from '../../repositories/chime_chat_channel_member.repository';
import { ChimeChatMemberRepo } from '../../repositories/chime_chat_member.repository';
import { ChatingController } from './chatting-int.controller';
import { ChatingService } from './chatting-int.service';

@Module({
  imports: [
    ConfigModule,
    TaskQueueModule,
    HttpModule,
    JwtModule,
    TypeOrmExModule.forCustomRepository([
      ChimeChatChannelRepo,
      ChimeChatMemberRepo,
      ChimeChatChannelMemberRepo,
      ChimeChatMessagesRepo
    ]),
    // Communication
  ],
  controllers: [ChatingController],
  providers: [ChatingService, RealTimeService],
})
export class ChatingIntModule {}
