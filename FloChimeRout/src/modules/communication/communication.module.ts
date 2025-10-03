/* eslint-disable prettier/prettier */
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import {
  RealtimeListener
} from './listeners';
import { MeetingListener } from './listeners/meeting.listener';
import { RealTimeService } from './services';

@Module({
  imports: [HttpModule, JwtModule.registerAsync({
    imports: [ConfigModule],
    useFactory: async (configService: ConfigService) => ({
      global: true,
      secret: configService.get<string>('app.realTimeSecret'),
      signOptions: { expiresIn: configService.get<string>('app.realTimeExpiredToken') }
    }),
    inject: [ConfigService],
  })],
  controllers: [],
  providers: [
    RealTimeService,
    RealtimeListener,
    MeetingListener
  ],
})
export class Communication { }