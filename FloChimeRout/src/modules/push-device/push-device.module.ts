import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PushDeviceController } from './push-device.controller';
import { PushDeviceService } from './push-device.service';

@Module({
  imports: [HttpModule, ConfigModule],
  controllers: [PushDeviceController],
  providers: [PushDeviceService],
})
export class PushDeviceModule {}
