import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collection, GlobalSetting } from '../../common/entities';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { DeletedItemModule } from '../deleted-item/deleted-item.module';
import { GlobalSettingController } from './setting.controller';
import { GlobalSettingService } from './setting.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GlobalSetting,
      Collection
    ]),
    DeletedItemModule,
    BullMqQueueModule
  ],
  controllers: [GlobalSettingController],
  providers: [GlobalSettingService],
  exports: [ GlobalSettingService]
})
export class GlobalSettingModule {}
