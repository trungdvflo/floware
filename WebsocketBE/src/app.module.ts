import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { HeaderAuthorizationMiddleware } from './auth/auth.middleware';
import { AuthModule } from './auth/auth.module';
import { ChannelModule } from './channel/channel.module';
import { NODE_ENV } from './common/constants';
import appConfig from './configs/app.config';
import redisClusterConfig from './configs/redis-cluster.config';
import redisStandaloneConfig from './configs/redis-standalone.config';
import redisWsAdapterConfig from './configs/redis-ws-adapter.config';
import redisWsStreamAdapterConfig from './configs/redis-ws-stream-adapter.config';
import { authorizedRoutes } from './configs/routes.config';
import { DatabaseModule } from './database/database.module';
import { ListenerModule } from './listeners/module.listener';
import { MessageModule } from './message/message.module';
import { MicroServiceProducerModule } from './microservice-producer/microservice-producer.module';
import { MicroserviceSubscriberModule } from './microservice-subscriber/microservice-subscriber.module';
import { RedisModule } from './redis/redis.module';
import { SettingModule } from './setting/setting.module';
import { StatisticsModule } from './statistics/statictics.module';
import { UserModule } from './user/user.module';
import { WebsocketModules } from './websocket/websocket.modules';
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [
        redisStandaloneConfig,
        appConfig,
        redisWsAdapterConfig,
        redisWsStreamAdapterConfig,
        redisClusterConfig,
      ],
      expandVariables: true,
      ignoreEnvFile: process.env.NODE_ENV === NODE_ENV.production,
    }),
    EventEmitterModule.forRoot({
      ignoreErrors: true,
    }),
    AuthModule,
    SettingModule,
    WebsocketModules,
    MessageModule,
    DatabaseModule,
    ChannelModule,
    MicroserviceSubscriberModule,
    MicroServiceProducerModule,
    UserModule,
    ListenerModule,
    StatisticsModule,
    RedisModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HeaderAuthorizationMiddleware).forRoutes(...authorizedRoutes);
  }
}
