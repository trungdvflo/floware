import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformSettingDefault } from '../../common/entities/platform-setting-default.entity';
import { DatabaseModule } from '../database/database.module';
import { PlatformSettingDefaultController } from './platform-setting-default.controller';
import { PlatformSettingDefaultService } from './platform-setting-default.service';
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([PlatformSettingDefault]),
    DatabaseModule,
  ],
  controllers: [PlatformSettingDefaultController],
  providers: [PlatformSettingDefaultService],
  exports: [PlatformSettingDefaultService]
})
export class PlatformSettingDefaultModule {}