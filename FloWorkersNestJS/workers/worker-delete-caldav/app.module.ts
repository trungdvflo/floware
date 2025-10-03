import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WORKER_ENV } from '../common/configs/aws.config';
import dbConfig from '../common/configs/db.config';
import redisConfig from '../common/configs/redis-master.config';
import appConfig from '../common/configs/worker.config';
import { DeleteCaldavWorker } from './src/delete-caldav.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, dbConfig, redisConfig],
      expandVariables: true,
      ignoreEnvFile: process.env.NODE_ENV === WORKER_ENV.production,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => configService.get('database')
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: +configService.get('redis.port'),
          db: +configService.get('redis.db'),
          password: configService.get('redis.password'),
          tls: configService.get('redis.tls')
        },
        defaultJobOptions: {
          removeOnComplete: configService.get('redis.removeOnComplete'),
          removeOnFail: configService.get('redis.removeOnFail')
        },
      }),
    }),
    DeleteCaldavWorker,
  ],
})
export class AppModule { }
