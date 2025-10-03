import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShareMember } from '../../common/entities/share-member.entity';
import { CollectionNotificationRepository } from '../../common/repositories/collection-notification.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { CollectionNotificationController } from './collection-notification.controller';
import { CollectionNotificationService } from './collection-notification.service';
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      ShareMember,
    ]),
    TypeOrmExModule.forCustomRepository([
      CollectionNotificationRepository,
      CollectionNotificationRepository,
    ]),
    DeletedItemModule,
    DatabaseModule,
    BullMqQueueModule,
  ],
  controllers: [CollectionNotificationController],
  providers: [CollectionNotificationService],
  exports: [CollectionNotificationService]
})
export class CollectionNotificationModule {}
