import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KanbanCard } from '../../../common/entities/kanban-card.entity';
import { LinkedCollectionObject } from '../../../common/entities/linked-collection-object.entity';
import { ShareMember } from '../../../common/entities/share-member.entity';
import { LoggerModule } from '../../../common/logger/logger.module';
import { CollectionActivityRepository } from '../../../common/repositories/collection-activity.repository';
import { LinkedCollectionObjectRepository } from '../../../common/repositories/linked-collection-object.repository';
import { TypeOrmExModule } from '../../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../../bullmq-queue/bullmq-queue.module';
import { CollectionModule } from '../../collection/collection.module';
import { DatabaseModule } from '../../database/database.module';
import { DeletedItemModule } from '../../deleted-item/deleted-item.module';
import { GlobalSettingModule as SettingModule } from '../../setting/setting.module';
import { ThirdPartyAccountModule } from '../../third-party-account/third-party-account.module';
import { TrashModule } from '../../trash/trash.module';
import { LinkedCollectionObjectController } from './linked-collection-object.controller';
import { LinkedCollectionObjectService } from './linked-collection-object.service';

@Module({
  imports: [TypeOrmModule.forFeature([
      LinkedCollectionObject, KanbanCard, ShareMember
    ]),
    TypeOrmExModule.forCustomRepository([
      CollectionActivityRepository,
      LinkedCollectionObjectRepository
    ]),
    LoggerModule,
    BullMqQueueModule,
    DeletedItemModule,
    DatabaseModule,
    ThirdPartyAccountModule,
    TrashModule,
    CollectionModule,
    SettingModule],
  providers: [LinkedCollectionObjectService],
  controllers: [LinkedCollectionObjectController],
  exports: [LinkedCollectionObjectService],
})
export class LinkedCollectionObjectModule { }
