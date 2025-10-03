import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FloInvalidLinkRepository } from '../../common/repository/flo-invalid-link.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { InvalidLinkDeletionProcessor } from './invalid-data-deletion.processor';
import { InvalidDataDeletionService } from './invalid-data-deletion.service';

@Module({
  imports: [
    ConfigModule,
    TypeORMModule.forCustomRepository([
      FloInvalidLinkRepository
    ]),
  ],
  providers: [
    InvalidDataDeletionService,
    RabbitMQQueueService,
    InvalidLinkDeletionProcessor
  ]
})
export class InvalidLinkWorker { }
