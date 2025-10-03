import { Module } from '@nestjs/common';
import { LoggerModule } from '../../common/logger/logger.module';
import { CollectionHistoryRepository } from '../../common/repositories/collection-history.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      CollectionHistoryRepository
    ]),
    DeletedItemModule,
    DatabaseModule,
    BullMqQueueModule,
    LoggerModule

  ],
  controllers: [HistoryController],
  providers: [HistoryService],
  exports: [HistoryService],
})
export class CollectionHistoryModule { }