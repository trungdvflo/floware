import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RuleEntity } from '../../common/entities/manual-rule.entity';
import { Users } from '../../common/entities/users.entity';
import { RuleRepository } from '../../common/repositories/rule.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../../modules/bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { LinkedCollectionObjectModule } from '../link/collection/linked-collection-object.module';
import { TrashModule } from '../trash/trash.module';
import { ManualRuleController } from './manual-rule.controller';
import { ManualRuleService } from './manual-rule.service';
import { SieveEmailService } from './sieve.email';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([RuleEntity, Users]),
    TypeOrmExModule.forCustomRepository([
      RuleRepository,
    ]),
    HttpModule,
    DeletedItemModule,
    DatabaseModule,
    LinkedCollectionObjectModule,
    TrashModule,
    BullMqQueueModule
  ],
  controllers: [ManualRuleController],
  providers: [ManualRuleService, SieveEmailService],
  exports: [ManualRuleService, SieveEmailService],
})
export class ManualRuleModule {}
