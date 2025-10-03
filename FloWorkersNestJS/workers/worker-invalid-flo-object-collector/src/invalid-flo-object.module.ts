import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FloInvalidLinkRepository } from '../../common/repository/flo-invalid-link.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { InvalidLinkFloObjectCollectorProcessor } from './invalid-flo-object.processor';
import { InvalidFloObjectService } from './invalid-flo-object.service';

@Module({
  imports: [
    ConfigModule,
    TypeORMModule.forCustomRepository([
      FloInvalidLinkRepository
    ]),
  ],
  providers: [
    InvalidFloObjectService,
    RabbitMQQueueService,
    InvalidLinkFloObjectCollectorProcessor
  ]
})
export class InvalidFloObjectWorker { }
