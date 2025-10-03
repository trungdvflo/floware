import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkedCollectionObject } from '../../common/entities/linked-collection-object.entity';
import { LoggerModule } from '../../common/logger/logger.module';
import { RuleRepository } from '../../common/repositories/rule.repository';
import { TrashRepository } from '../../common/repositories/trash.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { SieveEmailService } from '../manual-rule/sieve.email';
import { ShareMemberModule } from '../share-member/share-member.module';
import { TrashMemberController } from './trash-member.controller';
import { TrashMemberService } from './trash-member.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LinkedCollectionObject
    ]),
    TypeOrmExModule.forCustomRepository([
      TrashRepository,
      RuleRepository
    ]),
    HttpModule,
    ShareMemberModule,
    DeletedItemModule,
    BullMqQueueModule,
    LoggerModule
  ],
  providers: [TrashMemberService, SieveEmailService],
  controllers: [TrashMemberController],
  exports: [TrashMemberService],
})
export class TrashMemberModule { }