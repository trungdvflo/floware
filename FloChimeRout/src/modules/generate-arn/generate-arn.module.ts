import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggerModule } from 'common/logger/logger.module';
import { TypeOrmExModule } from 'modules/database/typeorm-ex.module';
import { ChimeChatChannelRepo } from 'repositories/chime_chat_channel.repository';
import { ChimeChatChannelMemberRepo } from 'repositories/chime_chat_channel_member.repository';
import { ChimeChatMemberRepo } from 'repositories/chime_chat_member.repository';
import { ChimeChatMessagesRepo } from 'repositories/chime_chat_messages.repository';
import { ShareMemberRepo } from 'repositories/collection-shared-member.repository';
import { ConferenceMemberRepo } from 'repositories/conference_member.repository';
import { GenerateArnMQProcessor } from './generate-arn.processor';
import { GenerateArnService } from './generate-arn.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
    ]),
    TypeOrmExModule.forCustomRepository([
      ChimeChatChannelRepo,
      ChimeChatMemberRepo,
      ChimeChatChannelMemberRepo,
      ConferenceMemberRepo,
      ShareMemberRepo,
      ChimeChatMessagesRepo,
    ]),
    LoggerModule,
  ],
  controllers: [],
  providers: [GenerateArnService, GenerateArnMQProcessor],
})
export class GenerateArnModule {}
