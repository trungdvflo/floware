import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CommunicationController } from './communication.controller';
import {
  ChimeListener, ConferenceListener,
  RealtimeListener, SharedCollectionListener
} from './listeners';
import { ChimeChatService, RealTimeService } from './services';

@Module({
  imports: [
    HttpModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('app.realTimeSecret'),
        signOptions: { expiresIn: configService.get<string>('app.realTimeExpiredToken') }
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [CommunicationController],
  providers: [
    RealTimeService, RealtimeListener, ChimeChatService,
    SharedCollectionListener, ChimeListener, ConferenceListener
  ],
})
export class Communication { }