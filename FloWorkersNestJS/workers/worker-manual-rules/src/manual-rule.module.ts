import { HttpModule } from '@nestjs/axios';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import rabbitmqConfig from '../../common/configs/rabbitmq.config';
import { RabbitMQQueueService } from '../../common/services/rabbitmq.service';
import { DOVECOT_LINKED_MAIL_COLLECTION } from '../common/constants/worker.constant';
import { ManualRuleRabbitMQProcessor } from './manual-rule-rabbitmq.processor';
import { ManualRuleProcessor } from './manual-rule.processor';
import { ManualRuleService } from './manual-rule.service';
@Module({
  imports: [
    ConfigModule,
    HttpModule,
    BullModule.registerQueueAsync({
      name: rabbitmqConfig().enable ? null : DOVECOT_LINKED_MAIL_COLLECTION
    })
  ],
  providers: [
    ManualRuleService,
    ...(rabbitmqConfig().enable
      ? [RabbitMQQueueService, ManualRuleRabbitMQProcessor]
      : [ManualRuleProcessor])
  ]
})
export class ManualRuleWorker { }
