import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmExModule } from 'modules/database/typeorm-ex.module';
import { MeetingInfoRepository } from 'repositories/meeting-info.repository';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';
import { ConferenceHistoryRepository } from './repositories/conference-history.repository';
import { ConferencingMemberRepository } from './repositories/conferencing-member.repository';

@Module({
  imports: [
    ConfigModule,
    TypeOrmExModule.forCustomRepository([
      ConferenceHistoryRepository,
      ConferencingMemberRepository,
      MeetingInfoRepository
    ]),
  ],
  controllers: [ChannelController],
  providers: [ChannelService],
})
export class ChannelModule {}
