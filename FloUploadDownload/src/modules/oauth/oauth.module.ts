
import { CacheModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import * as redisStore from 'cache-manager-redis-store';
import { JWT_SECRET_KEY } from '../../common/constants';
import appConfig from '../../configs/app';
import cfgRedis from '../../configs/redis';
import { OAuthService } from './oauth.service';

@Module({
  imports: [
    ConfigModule.forFeature(cfgRedis),
    JwtModule.register({ secret: JWT_SECRET_KEY }),
    CacheModule.registerAsync({
      imports: [ConfigModule.forFeature(appConfig)],
      isGlobal: true,
      extraProviders: [],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        host: configService.get('redis.host'),
        port: configService.get('redis.port'),
        db: configService.get('redis.db'),
        password: configService.get('redis.password'),
        tls: configService.get('redis.tls')
      }),
      inject: [ConfigService]
    })
  ],
  providers: [
    OAuthService,
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: CacheInterceptor,
    // },
  ],
  exports: [OAuthService]
})
export class OAuthModule { }
