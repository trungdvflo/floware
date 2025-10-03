import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionIconEntity } from '../../common/entities/collection-icon.entity';
import { ShareMember } from '../../common/entities/share-member.entity';
import {
  CollectionRepository, KanbanRepository, RuleRepository
} from '../../common/repositories';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { ChimeChatService } from '../communication/services';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { SieveEmailService } from '../manual-rule/sieve.email';
import { GlobalSettingModule as SettingModule } from '../setting/setting.module';
import { CollectionController } from './collection.controller';
import { CollectionService } from './collection.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ShareMember,
      CollectionIconEntity
    ]),
    TypeOrmExModule.forCustomRepository([
      CollectionRepository,
      RuleRepository,
      KanbanRepository
    ]),
    HttpModule,
    DeletedItemModule,
    DatabaseModule,
    BullMqQueueModule,
    SettingModule,
  ],
  controllers: [CollectionController],
  providers: [CollectionService, SieveEmailService, ChimeChatService],
  exports: [CollectionService]
})
export class CollectionModule { }