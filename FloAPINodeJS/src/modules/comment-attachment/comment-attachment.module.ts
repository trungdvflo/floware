import { Module } from '@nestjs/common';
import { LoggerModule } from '../../common/logger/logger.module';
import { DeletedItemRepository } from '../../common/repositories/deleted-item.repository';
import { FileCommonRepository } from '../../common/repositories/file-common.repository';
import { QuotaRepository } from '../../common/repositories/quota.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { CommentAttachmentController } from './comment-attachment.controller';
import { CommentAttachmentService } from './comment-attachment.service';
@Module({
  imports: [
    BullMqQueueModule,
    TypeOrmExModule.forCustomRepository([
      FileCommonRepository,
      DeletedItemRepository,
      QuotaRepository,
    ]),
    LoggerModule,
  ],
  providers: [CommentAttachmentService],
  controllers: [CommentAttachmentController],
  exports: [CommentAttachmentService],
})
export class CommentAttachmentModule {}