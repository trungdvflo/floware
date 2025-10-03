import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Cloud } from '../../common/entities/cloud.entity';
import { DeletedItem } from '../../common/entities/deleted-item.entity';
import { ShareMember } from '../../common/entities/share-member.entity';
import { LoggerModule } from '../../common/logger/logger.module';
import { CollectionNotificationRepository } from '../../common/repositories/collection-notification.repository';
import { RuleRepository } from '../../common/repositories/rule.repository';
import { TrashRepository } from '../../common/repositories/trash.repository';
import { UrlRepository } from '../../common/repositories/url.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { ApiLastModifiedModule } from '../api-last-modified/api-last-modified.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { CollectionModule } from '../collection/collection.module';
import { DatabaseUtilitiesService } from '../database/database-utilities.service';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { SieveEmailService } from '../manual-rule/sieve.email';
import { TrashController } from './trash.controller';
import { TrashService } from './trash.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeletedItem,
      ShareMember,
      Cloud
    ]),
    TypeOrmExModule.forCustomRepository([
      TrashRepository,
      CollectionNotificationRepository,
      RuleRepository,
      UrlRepository,
    ]),
    HttpModule,
    CollectionModule,
    DeletedItemModule,
    LoggerModule,
    BullMqQueueModule,
    ApiLastModifiedModule,
  ],
  providers: [
    TrashService,
    DatabaseUtilitiesService,
    SieveEmailService,
  ],
  controllers: [TrashController],
  exports: [TrashService],
})
export class TrashModule {}