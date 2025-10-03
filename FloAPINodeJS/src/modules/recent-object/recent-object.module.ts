import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RecentObject } from '../../common/entities/recent-object.entity';
import { ThirdPartyAccount } from '../../common/entities/third-party-account.entity';
import { LoggerModule } from '../../common/logger/logger.module';
import { RecentObjectRepository } from '../../common/repositories/recent-object.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { RecentObjectController } from './recent-object.controller';
import { RecentObjectService } from './recent-object.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RecentObject,
      ThirdPartyAccount
    ]),
    TypeOrmExModule.forCustomRepository([
      RecentObjectRepository,
    ]),
    DeletedItemModule,
    DatabaseModule,
    BullMqQueueModule,
    LoggerModule
  ],
  controllers: [RecentObjectController],
  providers: [RecentObjectService],
  exports: [RecentObjectService]
})
export class RecentObjectModule { }
