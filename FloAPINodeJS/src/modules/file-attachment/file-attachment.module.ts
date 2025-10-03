import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkedCollectionObject } from '../../common/entities/linked-collection-object.entity';
import { TrashEntity } from '../../common/entities/trash.entity';
import { LoggerModule } from '../../common/logger/logger.module';
import { ShareMemberRepository } from '../../common/repositories';
import { FileAttachmentRepository } from '../../common/repositories/file-attachment.repository';
import { LinkedCollectionObjectRepository } from '../../common/repositories/linked-collection-object.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { FileController } from './file-attachment.controller';
import { FileService } from './file-attachment.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TrashEntity,
      LinkedCollectionObject
    ]),
    TypeOrmExModule.forCustomRepository([
      FileAttachmentRepository,
      ShareMemberRepository,
      LinkedCollectionObjectRepository
    ]),
    DeletedItemModule,
    DatabaseModule,
    LoggerModule,
    BullMqQueueModule
  ],
  controllers: [FileController],
  providers: [FileService]
})
export class FileModule { }
