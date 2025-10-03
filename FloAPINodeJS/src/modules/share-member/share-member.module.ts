import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Users } from '../../common/entities/users.entity';
import { KanbanRepository, ShareMemberRepository } from '../../common/repositories';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { CollectionModule } from '../collection/collection.module';
import {
  CollectionInstanceMemberModule
} from '../collection_instance_member/collection-instance-member.module';
import { ChimeChatService } from '../communication/services';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { KanbanModule } from '../kanban/kanban.module';
import { ShareMemberController } from './share-member.controller';
import { ShareMemberService } from './share-member.service';
@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([Users]),
    TypeOrmExModule.forCustomRepository([
      ShareMemberRepository,
      KanbanRepository
    ]),
    CollectionModule,
    CollectionInstanceMemberModule,
    KanbanModule,
    DeletedItemModule,
    DatabaseModule,
    BullMqQueueModule,
  ],
  controllers: [ShareMemberController],
  providers: [ShareMemberService, ChimeChatService],
  exports: [ShareMemberService]
})
export class ShareMemberModule { }
