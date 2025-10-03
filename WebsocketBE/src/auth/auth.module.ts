import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import * as redisStore from 'cache-manager-redis-store';
import { RedisModule } from '../redis/redis.module';
import { AuthService } from './auth.service';

@Module({
  imports: [
    ConfigModule,
    RedisModule,
    CacheModule.registerAsync({
      imports: [ConfigModule],
      isGlobal: true,
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('redisStandalone.host'),
        port: configService.get('redisStandalone.port'),
        db: configService.get('redisStandalone.db'),
        password: configService.get('redisStandalone.password'),
        tls: configService.get('redisStandalone.tls'),
      }),
      inject: [ConfigService],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('app.ws_secret'),
        signOptions: { expiresIn: configService.get<string>('app.ws_expired_token') },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, ConfigService],
  exports: [AuthService],
})
export class AuthModule {}
