import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { RedisModule } from '../redis/redis.module';
import { WsService } from './service/websocket.service';
import { WebsocketController } from './websocket.controller';
import { WebsocketGateway } from './websocket.gateway';
@Module({
  imports: [
    AuthModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('app.ws_secret'),
        signOptions: { expiresIn: configService.get<string>('app.ws_expired_token') },
      }),
      inject: [ConfigService],
    }),
    RedisModule,
  ],
  providers: [WebsocketGateway, AuthService, WsService, ConfigService],
  exports: [WebsocketGateway, WsService],
  controllers: [WebsocketController],
})
export class WebsocketModules {}
