import { Module } from '@nestjs/common';
import { LoggerModule } from '../../common/logger/logger.module';
import { ContactHistoryRepository } from '../../common/repositories/contact-history.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { ThirdPartyAccountModule } from '../third-party-account/third-party-account.module';
import { TrashModule } from '../trash/trash.module';
import { HistoryController } from './history.controller';
import { HistoryService } from './history.service';
@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      ContactHistoryRepository
    ]),
    DeletedItemModule,
    DatabaseModule,
    ThirdPartyAccountModule,
    TrashModule,
    LoggerModule,
    BullMqQueueModule
  ],
  controllers: [HistoryController],
  providers: [HistoryService]
})
export class HistoryModule {}
