import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WORKER_ENV } from '../common/configs/aws.config';
import dbConfig from '../common/configs/db.config';
import graylogConfig from '../common/configs/graylog.config';
import redisConfig from '../common/configs/redis-master.config';
import appConfig from './common/configs/worker.config';
import { ChildCollectionWorker } from './src/collection-child.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      load: [appConfig, dbConfig, graylogConfig, redisConfig],
      expandVariables: true,
      ignoreEnvFile: process.env.NODE_ENV === WORKER_ENV.production,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => await configService.get('database')
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: +configService.get('redis.port'),
          db: +configService.get('redis.db'),
          password: configService.get('redis.password'),
          tls: configService.get('redis.tls')
        },
        defaultJobOptions: {
          removeOnComplete: configService.get('redis.removeOnComplete'),
          removeOnFail: configService.get('redis.removeOnFail'),
        }
      }),
    }),
    ChildCollectionWorker,
  ],
})
export class AppModule {}
