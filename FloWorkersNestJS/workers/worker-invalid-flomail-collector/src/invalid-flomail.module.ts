import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FloInvalidLinkRepository } from '../../common/repository/flo-invalid-link.repository';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { TypeORMModule } from '../../common/utils/typeorm.module';
import { InvalidFloMailProcessor } from './invalid-flomail.processor';
import { InvalidFloMailService } from './invalid-flomail.service';

@Module({
  imports: [
    ConfigModule,
    TypeORMModule.forCustomRepository([
      FloInvalidLinkRepository
    ]),
  ],
  providers: [
    InvalidFloMailService,
    RabbitMQQueueService,
    InvalidFloMailProcessor
  ]
})
export class InvalidFloMailWorker { }
