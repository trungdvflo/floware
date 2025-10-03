import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QUEUE_NAME } from '../../common/constants/queue.constant';
import { LoggerModule } from '../../common/logger/logger.module';
import { ApiLastModifiedQueueService } from './api-last-modified-queue.service';
@Module({
  imports: [
    LoggerModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get('redis.host'),
          port: configService.get('redis.port'),
          db: configService.get('redis.db'),
          password: configService.get('redis.password'),
          tls: configService.get('redis.tls')
        },
        defaultJobOptions: {
          removeOnComplete: configService.get('redis.removeOnComplete'),
          removeOnFail: configService.get('redis.removeOnFail')
        }
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue(
      {
        name: QUEUE_NAME.API_LAST_MODIFIED_QUEUE,
      },
    )
  ],
  providers: [
    ApiLastModifiedQueueService,
  ],
  exports: [
    ApiLastModifiedQueueService,
  ],
})
export class BullMqQueueModule { }