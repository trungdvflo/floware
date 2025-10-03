import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformSetting } from '../../common/entities/platform-setting.entity';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { PlatformSettingController } from './platform-setting.controller';
import { PlatformSettingService } from './platform-setting.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlatformSetting
    ]),
    BullMqQueueModule,
  ],
  controllers: [PlatformSettingController],
  providers: [PlatformSettingService]
})
export class PlatformSettingModule {}
