import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import rabbitmqConfig from '../../common/configs/rabbitmq.config';
import { DeviceTokenRepository } from '../../common/repository/api-last-modify.repository';
import { DeleteItemRepository } from '../../common/repository/delete-item.repository';
import { FileCommonRepository } from '../../common/repository/file-common.repository';
import { LinkedFileCommonRepository } from '../../common/repository/link-file-common.repository';
import { PushChangeRepository } from '../../common/repository/push-change.repository';
import { QuotaRepository } from '../../common/repository/quota.repository';
import { UserRepository } from '../../common/repository/user.repository';
import { WasabiService } from '../../common/services/handle-washabi.service';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { FILE_QUEUE, SUBSCRIPTION_SEND_EMAIL_QUEUE } from '../common/constants/worker.constant';
import { CommonService } from './common.service';
import { FileRabbitMQProcessor } from './file-rabbitmq.processor';
import { FileProcessor } from './file.processor';
import { PushChangeCronJob } from './push-change.cronjob';
import { SubscriptionRabbitMQProcessor } from './subscription-rabbitmq.processor';
import { SubcriptionCronJob } from './subscription.conjob';
import { SubcriptionCronJobService } from './subscription.cronjob.service';
import { SubscriptionProcessor } from './subscription.processor';

@Module({
  imports: [
    ConfigModule,
    TypeORMModule.forCustomRepository([
      UserRepository,
      PushChangeRepository,
      DeviceTokenRepository,
      FileCommonRepository,
      LinkedFileCommonRepository,
      QuotaRepository,
      DeleteItemRepository
    ]),
    BullModule.registerQueueAsync(
      { name: rabbitmqConfig().enable ? null : SUBSCRIPTION_SEND_EMAIL_QUEUE },
      { name: rabbitmqConfig().enable ? null : FILE_QUEUE },
    )
  ],
  providers: [
    CommonService,
    WasabiService,
    RabbitMQQueueService,
    SubcriptionCronJobService,
    PushChangeCronJob,
    SubcriptionCronJob,
    ...(rabbitmqConfig().enable
      ? [FileRabbitMQProcessor, SubscriptionRabbitMQProcessor]
      : [FileProcessor, SubscriptionProcessor])
  ],
})
export class CommonWorker { }
