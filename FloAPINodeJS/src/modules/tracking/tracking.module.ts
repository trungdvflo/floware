import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThirdPartyAccount } from '../../common/entities/third-party-account.entity';
import { Tracking } from '../../common/entities/tracking.entity';
import { LoggerModule } from '../../common/logger/logger.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { TrackingController } from './tracking.controller';
import { TrackingService } from './tracking.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Tracking,
      ThirdPartyAccount
    ]),
    DatabaseModule,
    DeletedItemModule,
    LoggerModule,
    BullMqQueueModule
  ],
  providers: [
    TrackingService
  ],
  controllers: [TrackingController],
  exports: [TrackingService],
})
export class TrackingModule { }
