import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareMember } from '../../common/entities/share-member.entity';
import { CollectionActivityRepository } from '../../common/repositories/collection-activity.repository';
import { CollectionNotificationRepository } from '../../common/repositories/collection-notification.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { CollectionActivityController } from './collection-activity.controller';
import { CollectionActivityService } from './collection-activity.service';
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      ShareMember,
    ]),
    TypeOrmExModule.forCustomRepository([
      CollectionActivityRepository,
      CollectionNotificationRepository,
    ]),
    DeletedItemModule,
    DatabaseModule,
    BullMqQueueModule,
  ],
  controllers: [CollectionActivityController],
  providers: [CollectionActivityService],
  exports: [CollectionActivityService]
})
export class CollectionActivityModule {}
