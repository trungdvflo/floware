import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';
import appConfig from '../../configs/app.config';
import redisConfig from '../../configs/redis.config';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
@Module({
  imports: [
    JwtModule.register({ secret: appConfig().jwtSecretKey }),
    CacheModule.registerAsync({
      imports: [ConfigModule.forFeature(redisConfig)],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('redis.host'),
        port: configService.get('redis.port'),
        db: configService.get('redis.db'),
        password: configService.get('redis.password'),
        tls: configService.get('redis.tls'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
