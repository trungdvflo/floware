import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { WORKER_ENV } from '../common/configs/aws.config';
import redisConfig from '../common/configs/redis-master.config';
import appConfig from './common/configs/worker.config';
import { ManualRuleWorker } from './src/manual-rule.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      load: [appConfig, redisConfig],
      expandVariables: true,
      ignoreEnvFile: process.env.NODE_ENV === WORKER_ENV.production,
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
          removeOnFail: configService.get('redis.removeOnFail')
        },
      }),
    }),
    ManualRuleWorker,
  ],
})
export class AppModule {}
