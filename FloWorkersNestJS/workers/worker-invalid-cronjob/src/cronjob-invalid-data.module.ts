import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FloInvalidLinkRepository } from '../../common/repository/flo-invalid-link.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { InvalidDataDeletionCronJob } from '../../worker-invalid-cronjob/src/invalid-data-deletion.cronjob';
import { EmailFinderCronJob } from './email-finder.cronjob';
import { InvalidCronjobService } from './invalid-cronjob.service';
import { InvalidFloObjectCronJob } from './invalid-flo-object.cronjob';
@Module({
  imports: [
    ConfigModule,
    TypeORMModule.forCustomRepository([
      FloInvalidLinkRepository
    ]),
  ],
  providers: [
    InvalidDataDeletionCronJob,
    InvalidFloObjectCronJob,
    EmailFinderCronJob,
    RabbitMQQueueService,
    InvalidCronjobService
  ]
})
export class CronJobInvalidData { }
