import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import rabbitmqConfig from '../../common/configs/rabbitmq.config';
import {
    WORKER_API_LAST_MODIFIED,
    WORKER_REPORT_CACHED_USER
} from '../../common/constants/worker.constant';
import { ApiLastModifiedCommonModule } from '../../common/modules/last-modified/api-last-modify-common.module';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { ApiLastModifyRabbitMQProcessor } from './api-last-modify-rabbitmq.processor';
import { ApiLastModifyProcessor } from './api-last-modify.processor';
import { ApiLastModifiedService } from './api-last-modify.service';

@Module({
  imports: [
    ConfigModule,
    ApiLastModifiedCommonModule,
    BullModule.registerQueueAsync(
      { name: rabbitmqConfig().enable ? null : WORKER_API_LAST_MODIFIED.QUEUE },
      { name: WORKER_REPORT_CACHED_USER.QUEUE }
    )
  ],
  providers: [
    ApiLastModifiedService,
    ...(rabbitmqConfig().enable
      ? [RabbitMQQueueService, ApiLastModifyRabbitMQProcessor]
      : [ApiLastModifyProcessor])

  ]
})
export class ApiLastModifiedWorker { }
