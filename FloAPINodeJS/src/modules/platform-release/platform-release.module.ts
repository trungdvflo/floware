import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PlatformReleasePushNotification } from '../../common/entities/platform-release-push-notifications.entity';
import { PlatformReleasePushNotificationRepository } from '../../common/repositories/platform-release-push-notification.repository';
import { ReleaseRepository } from '../../common/repositories/release.repository';
import { TypeOrmExModule } from '../../common/utils/typeorm-ex.module';
import { PlatformReleaseController } from './platform-release.controller';
import { PlatformReleaseService } from './platform-release.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PlatformReleasePushNotification,
    ]),
    TypeOrmExModule.forCustomRepository([
      ReleaseRepository,
      PlatformReleasePushNotificationRepository
    ]),
  ],
  controllers: [PlatformReleaseController],
  providers: [PlatformReleaseService]
})
export class PlatformReleaseModule { }
