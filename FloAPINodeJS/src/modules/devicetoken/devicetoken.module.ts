import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccessToken } from '../../common/entities/access-token.entity';
import { Devicetoken } from '../../common/entities/devicetoken.entity';
import { Release } from '../../common/entities/release.entity';
import { UserPlatformVersion } from '../../common/entities/user-platform-version.entity';
import { LoggerModule } from '../../common/logger/logger.module';
import { BullMqQueueModule } from '../bullmq-queue/bullmq-queue.module';
import { OAuthModule } from '../oauth/oauth.module';
import { DevicetokenController } from './devicetoken.controller';
import { DeviceTokenEmailService } from './devicetoken.email';
import { DevicetokenService } from './devicetoken.service';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([
      Devicetoken,
      AccessToken,
      Release,
      UserPlatformVersion
    ]),
    LoggerModule,
    OAuthModule,
    BullMqQueueModule
  ],
  providers: [DevicetokenService, DeviceTokenEmailService],
  controllers: [DevicetokenController],
  exports: [DevicetokenService],
})
export class DevicetokenModule { }
