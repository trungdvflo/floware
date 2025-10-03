import { Module } from '@nestjs/common';
import { LoggerModule } from '../../common/logger/logger.module';
import {
  CollectionCommentRepository,
  CommentMentionRepository
} from '../../common/repositories';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      CollectionCommentRepository,
      CommentMentionRepository
    ]),
    DeletedItemModule,
    DatabaseModule,
    BullMqQueueModule,
    LoggerModule

  ],
  controllers: [CommentController],
  providers: [CommentService],
  exports: [CommentService],
})
export class CommentModule { }