import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LinkedObject } from '../../../common/entities/linked-object.entity';
import { LoggerModule } from '../../../common/logger/logger.module';
import { LinkedObjectRepository } from '../../../common/repositories/linked-object.repository';
import { TypeOrmExModule } from '../../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../../../modules/bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../../database/database.module';
import { DeletedItemModule } from '../../deleted-item/deleted-item.module';
import { ThirdPartyAccountModule } from '../../third-party-account/third-party-account.module';
import { TrashModule } from '../../trash/trash.module';
import { LinkedObjectController } from './linked-object.controller';
import { LinkedObjectService } from './linked-object.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([LinkedObject]),
    TypeOrmExModule.forCustomRepository([
      LinkedObjectRepository
    ]),
  LoggerModule,
  BullMqQueueModule,
  DeletedItemModule,
  DatabaseModule,
  TrashModule,
  ThirdPartyAccountModule],
  providers: [LinkedObjectService],
  controllers: [LinkedObjectController],
  exports: [LinkedObjectService],
})
export class LinkedObjectModule {}
