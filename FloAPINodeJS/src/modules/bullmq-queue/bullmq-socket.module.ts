import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QueueName } from '../../common/constants';
import { LoggerModule } from '../../common/logger/logger.module';
import { WebSocketQueueService } from './web-socket-queue.service';
@Module({
  imports: [
    LoggerModule,
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        prefix: `{bull}`,
        connection: {
          host: configService.get('redisCluster.host'),
          port: configService.get('redisCluster.port'),
          db: configService.get('redisCluster.db'),
          password: configService.get('redisCluster.password'),
          tls: configService.get('redisCluster.tls')
        },
        defaultJobOptions: {
          removeOnComplete: configService.get('redisCluster.removeOnComplete'),
          removeOnFail: configService.get('redisCluster.removeOnFail')
        }
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: QueueName().WEB_SOCKET_QUEUE
    })
  ],
  providers: [
    WebSocketQueueService,
  ],
  exports: [
    WebSocketQueueService,
  ],
})
export class BullMqSocketModule { }