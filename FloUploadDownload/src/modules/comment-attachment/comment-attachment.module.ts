import { Module } from '@nestjs/common';
import { CommentAttachmentController } from './comment-attachment.controller';
import { CommentAttachmentService } from './comment-attachment.service';
import { BullMqQueueModule } from '../queue/queue.module';
import { LoggerModule } from '../../common/logger/logger.module';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { FileCommonRepository } from '../../common/repositories/file-common.repository';
import { DeletedItemRepository } from '../../common/repositories/delete-item.repository';
@Module({
  imports: [
    BullMqQueueModule,
    TypeOrmExModule.forCustomRepository([
      FileCommonRepository,
      DeletedItemRepository,
    ]),
    LoggerModule,
  ],
  providers: [CommentAttachmentService],
  controllers: [CommentAttachmentController],
  exports: [CommentAttachmentService],
})
export class CommentAttachmentModule {}