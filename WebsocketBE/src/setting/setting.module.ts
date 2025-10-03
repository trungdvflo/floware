import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SettingRepository } from '../database/repositories';
import { SettingController } from './setting.controller';
import { SettingService } from './setting.service';

@Module({
  imports: [AuthModule],
  controllers: [SettingController],
  providers: [SettingService, SettingRepository],
  exports: [SettingService],
})
export class SettingModule {}
