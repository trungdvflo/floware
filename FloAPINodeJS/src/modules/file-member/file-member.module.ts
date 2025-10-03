import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  LinkedCollectionObject
} from '../../common/entities/linked-collection-object.entity';
import { ShareMember } from '../../common/entities/share-member.entity';
import { LoggerModule } from '../../common/logger/logger.module';
import { ShareMemberRepository } from '../../common/repositories';
import { FileAttachmentRepository } from '../../common/repositories/file-attachment.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { FileMemberController } from './file-member.controller';
import { FileMemberService } from './file-member.service';

@Module({
  imports: [
    BullMqQueueModule,
    TypeOrmModule.forFeature([
      ShareMember,
      LinkedCollectionObject
    ]),
    TypeOrmExModule.forCustomRepository([
      FileAttachmentRepository,
      ShareMemberRepository,
    ]),
    DeletedItemModule,
    DatabaseModule,
    LoggerModule
  ],
  controllers: [FileMemberController],
  providers: [FileMemberService]
})
export class FileMemberModule {}
