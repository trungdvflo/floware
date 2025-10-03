import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionPurchaseRepository, SubscriptionRepository } from '../../common/repositories/subscription.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
@Module({
  imports: [
    ConfigModule,
    TypeOrmExModule.forCustomRepository([
      SubscriptionRepository,
      SubscriptionPurchaseRepository
    ]),
    BullMqQueueModule
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
  exports: [SubscriptionService]
})
export class SubscriptionModule {}
