import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SystemCollection } from '../../../common/entities/collection-system.entity';
import { Users } from '../../../common/entities/users.entity';
import { BullMqQueueModule } from '../../../modules/bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../../database/database.module';
import { DeletedItemModule } from '../../deleted-item/deleted-item.module';
import { CollectionModule } from '../collection.module';
import { SystemCollectionController } from './system-collection.controller';
import { SystemCollectionService } from './system-collection.service';
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([SystemCollection, Users]),
    CollectionModule,
    DeletedItemModule,
    DatabaseModule,
    BullMqQueueModule
  ],
  controllers: [SystemCollectionController],
  providers: [SystemCollectionService],
  exports: [SystemCollectionService]
})
export class SystemCollectionModule {}
