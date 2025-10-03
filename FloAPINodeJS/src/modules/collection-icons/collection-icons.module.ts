import { Module } from '@nestjs/common';
import { LoggerModule } from '../../common/logger/logger.module';
import { CollectionIconsRepository } from '../../common/repositories/collection-icons.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { CollectionIconsController } from './collection-icons.controller';
import { CollectionIconsService } from './collection-icons.service';

@Module({
  imports: [
    TypeOrmExModule.forCustomRepository([
      CollectionIconsRepository
    ]),
    DatabaseModule,
    BullMqQueueModule,
    LoggerModule

  ],
  controllers: [CollectionIconsController],
  providers: [CollectionIconsService],
  exports: [CollectionIconsService],
})
export class CollectionIconsModule { }