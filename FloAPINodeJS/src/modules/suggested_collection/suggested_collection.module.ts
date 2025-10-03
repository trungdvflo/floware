import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection } from '../../common/entities/collection.entity';
import { IdenticalSender } from '../../common/entities/identical_sender.entity';
import { SuggestedCollection } from '../../common/entities/suggested_collection.entity';
import { ThirdPartyAccount } from '../../common/entities/third-party-account.entity';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { SeggestedCollectionController } from './suggested_collection.controller';
import { SuggestedCollectionService } from './suggested_collection.service';
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      SuggestedCollection,
      IdenticalSender,
      Collection,
      ThirdPartyAccount
    ]),
    DeletedItemModule,
    DatabaseModule,
    BullMqQueueModule,
  ],
  controllers: [SeggestedCollectionController],
  providers: [SuggestedCollectionService],
  exports: [SuggestedCollectionService]
})
export class SeggestedCollectionModule {}
