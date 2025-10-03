import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KanbanCard } from '../../../common/entities/kanban-card.entity';
import { LinkedCollectionObject } from '../../../common/entities/linked-collection-object.entity';
import { LoggerModule } from '../../../common/logger/logger.module';
import { CollectionActivityRepository } from '../../../common/repositories/collection-activity.repository';
import { TypeOrmExModule } from '../../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../../database/database.module';
import { DeletedItemModule } from '../../deleted-item/deleted-item.module';
import { GlobalSettingModule as SettingModule } from '../../setting/setting.module';
import { ShareMemberModule } from '../../share-member/share-member.module';
import { ThirdPartyAccountModule } from '../../third-party-account/third-party-account.module';
import { LinkedCollectionObjectMemberController } from './linked-collection-object-member.controller';
import { LinkedCollectionObjectMemberService } from './linked-collection-object-member.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    LinkedCollectionObject, KanbanCard]),
  TypeOrmExModule.forCustomRepository([
    CollectionActivityRepository,
  ]),
  LoggerModule,
  BullMqQueueModule,
  DeletedItemModule,
  DatabaseModule,
  ThirdPartyAccountModule,
  ShareMemberModule,
  SettingModule,
  ],
  providers: [LinkedCollectionObjectMemberService],
  controllers: [LinkedCollectionObjectMemberController],
  exports: [LinkedCollectionObjectMemberService],
})
export class LinkedCollectionObjectMemberModule {}
