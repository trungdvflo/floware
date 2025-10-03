import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from '../../common/entities/collection.entity';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { CollectionModule } from '../collection/collection.module';
import { CollectionInstanceMemberModule } from '../collection_instance_member/collection-instance-member.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { KanbanModule } from '../kanban/kanban.module';
import { ShareMemberModule } from '../share-member/share-member.module';
import { CollectionMemberController } from './collection-member.controller';
import { CollectionMemberService } from './collection-member.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Collection]),
    DeletedItemModule,
    DatabaseModule,
    ShareMemberModule,
    BullMqQueueModule,
    CollectionInstanceMemberModule,
    KanbanModule,
    CollectionModule
  ],
  controllers: [CollectionMemberController],
  providers: [CollectionMemberService],
  exports: [CollectionMemberService],
})
export class CollectionMemberModule {}
