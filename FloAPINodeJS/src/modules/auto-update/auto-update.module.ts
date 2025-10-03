import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppRegister } from '../../common/entities/app-register.entity';
import { Config } from '../../common/entities/config.entity';
import { GroupsUser } from '../../common/entities/group-user.entity';
import { PlatformReleasePushNotification } from '../../common/entities/platform-release-push-notifications.entity';
import { Release } from '../../common/entities/release.entity';
import { ReleasesGroup } from '../../common/entities/releases-groups.entity';
import { ReleasesUser } from '../../common/entities/releases-user.entity';
import { UserRelease } from '../../common/entities/users-releases.entity';
import { AutoUpdateController } from './auto-update.controller';
import { AutoUpdateService } from './auto-update.service';

@Module({
  imports: [TypeOrmModule.forFeature([
    Release,
    AppRegister,
    PlatformReleasePushNotification,
    UserRelease,
    ReleasesUser,
    GroupsUser,
    ReleasesGroup,
    Config
  ])],
  providers: [AutoUpdateService],
  controllers: [AutoUpdateController],
  exports: [AutoUpdateService],
})
export class AutoUpdateModule {}