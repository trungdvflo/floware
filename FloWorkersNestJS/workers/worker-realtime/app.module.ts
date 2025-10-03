import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WORKER_ENV } from '../common/configs/aws.config';
import dbConfig from '../common/configs/db.config';
import appConfig from '../common/configs/worker.config';
import { RealtimeModule } from './src/realtime.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, dbConfig],
      expandVariables: true,
      ignoreEnvFile: process.env.NODE_ENV === WORKER_ENV.production,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => await configService.get('database')
    }),
    ScheduleModule.forRoot(),
    RealtimeModule
  ],
})
export class AppModule { }
