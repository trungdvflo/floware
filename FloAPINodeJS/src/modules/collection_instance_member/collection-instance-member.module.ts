import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollectionInstanceMember } from '../../common/entities/collection-instance-member.entity';
import { ShareMember } from '../../common/entities/share-member.entity';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { CollectionInstanceMemberController } from './collection-instance-member.controller';
import { CollectionInstanceMemberService } from './collection-instance-member.service';
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([CollectionInstanceMember, ShareMember]),
    DeletedItemModule,
    DatabaseModule,
    BullMqQueueModule,
  ],
  controllers: [CollectionInstanceMemberController],
  providers: [CollectionInstanceMemberService],
  exports: [CollectionInstanceMemberService]
})
export class CollectionInstanceMemberModule {}
