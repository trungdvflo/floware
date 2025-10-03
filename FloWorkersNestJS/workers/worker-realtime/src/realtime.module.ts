import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { RealtimeChannelMemberRepository } from 'workers/common/repository/realtime-channel-member.repository';
import { RealtimeChannelRepository } from 'workers/common/repository/realtime-channel.repository';
import { RealtimeChatChannelStatusRepository } from 'workers/common/repository/realtime-chat-channel-status.repository';
import { RealtimeChannelUserLastSeenRepository } from 'workers/common/repository/realtime-chat-channel-user-last-seen.repository';
import { TypeORMModule } from 'workers/common/utils/typeorm.module';
import { RealtimeCronJob } from './realtime.cronjob';
import { RealtimeService } from './realtime.service';
@Module({
  imports: [
    ConfigModule,
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('worker.realTimeSecret'),
        signOptions: { expiresIn: configService.get<string>('worker.realTimeExpiredToken') }
      }),
      inject: [ConfigService],
    }),
    TypeORMModule.forCustomRepository([
      RealtimeChatChannelStatusRepository,
      RealtimeChannelUserLastSeenRepository,
      RealtimeChannelMemberRepository,
      RealtimeChannelRepository
    ]),
  ],
  providers: [
    RealtimeService,
    RealtimeCronJob]
})
export class RealtimeModule {}
