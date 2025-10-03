import {
  CacheModule,
  MiddlewareConsumer,
  Module,
  NestModule,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as redisStore from 'cache-manager-redis-store';
import { NODE_ENV } from 'common/constants/environment.constant';
import { LoggerModule } from 'common/logger/logger.module';
import redisClusterConfig from 'configs/redis-cluster.config';
import { authorizedRoutes } from 'configs/routes.config';
import { AttendeeMeetingModule } from 'modules/attendee-meeting/attendee-meeting.module';
import { AttendeeModule } from 'modules/attendee/attendee.module';
import { HeaderAuthorizationMiddleware } from 'modules/auth/auth.middleware';
import { AuthModule } from 'modules/auth/auth.module';
import { ChannelModule } from 'modules/channel/channel.module';
import { ChatingIntModule } from 'modules/chatting-int/chatting-int.module';
import { ChatingModule } from 'modules/chatting/chatting.module';
import { Communication } from 'modules/communication/communication.module';
import { MeetingEventModule } from 'modules/event/meeting-event.module';
import { MeetingModule } from 'modules/meeting/meeting.module';
import { PushDeviceModule } from 'modules/push-device/push-device.module';
import { RedisModule } from 'modules/redis/redis.module';
import { TaskQueueModule } from 'modules/task-queue/task-queue.module';
import appConfig from './configs/app.config';
import chimeConfig from './configs/chime.config';
import redisConfig from './configs/redis.config';
import dbConfig from './configs/sql';
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // set this to `true` to use wildcards
      wildcard: false,
      // the delimiter used to segment namespaces
      delimiter: '.',
      // set this to `true` if you want to emit the newListener event
      newListener: false,
      // set this to `true` if you want to emit the removeListener event
      removeListener: false,
      // the maximum amount of listeners that can be assigned to an event
      maxListeners: 10,
      // show event name in memory leak message
      // ..when more than maximum amount of listeners is assigned
      verboseMemoryLeak: false,
      // disable throwing uncaughtException if an error
      // ..event is emitted and it has no listeners
      ignoreErrors: false,
    }),
    ConfigModule.forRoot({
      load: [appConfig, dbConfig, redisConfig, chimeConfig, redisClusterConfig],
      expandVariables: true,
      ignoreEnvFile: process.env.NODE_ENV === NODE_ENV.production,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        configService.get('database'),
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      isGlobal: true,
      extraProviders: [],
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
    AuthModule,
    AttendeeModule,
    AttendeeMeetingModule,
    MeetingModule,
    PushDeviceModule,
    ChatingModule,
    ChannelModule,
    ChatingIntModule,
    LoggerModule,
    MeetingEventModule,
    Communication,
    TaskQueueModule,
    RedisModule
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HeaderAuthorizationMiddleware)
      .forRoutes(...authorizedRoutes);
  }
}
