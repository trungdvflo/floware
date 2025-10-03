import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MetadataEmail } from '../../common/entities/metadata-email.entity';
import { ThirdPartyAccount } from '../../common/entities/third-party-account.entity';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DatabaseModule } from '../database/database.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { MetadataEmailController } from './metadata-email.controller';
import { MetadataEmailService } from './metadata-email.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MetadataEmail, ThirdPartyAccount
    ]),
    BullMqQueueModule,
    DeletedItemModule,
    DatabaseModule,
  ],
  providers: [
    MetadataEmailService
  ],
  controllers: [
    MetadataEmailController
  ],
  exports: [MetadataEmailService],
})
export class MetadataEmailModule { }
