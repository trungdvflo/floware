import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GetPlatformReleaseDto } from '../../modules/platform-release/dto/get-platform-release.dto';
import { RELEASE_STATUS } from '../constants/common';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { PlatformReleasePushNotification } from '../entities/platform-release-push-notifications.entity';
import { Release } from '../entities/release.entity';

@Injectable()
@CustomRepository(PlatformReleasePushNotification)
export class PlatformReleasePushNotificationRepository extends
  Repository<PlatformReleasePushNotification> {
  async getForceUpdateReleases(
    baseReleaseId: number,
    getPlatformReleaseDto: GetPlatformReleaseDto
  ) {
    return this
      .createQueryBuilder('prpn')
      .select(['force_update', 'title', 'message'])
      .innerJoinAndSelect(
        qb => {
          return qb
            .select(['id', 'app_id', 'version', 'build_number', 'created_date', 'updated_date', 'file_uid',
                     'os_support', 'checksum', 'release_note', 'release_time', 'length', 'url_download'])
            .from(Release, 'rs')
            .andWhere('build_number > :buildNumber', {
              buildNumber: getPlatformReleaseDto.build_number
            })
            .andWhere('release_status = :releaseStatus', {
              releaseStatus: RELEASE_STATUS.published
            });
        },
        'destination_rs',
        'prpn.destination_release_id = destination_rs.id'
      )
      .where('base_release_id = :baseReleaseId', { baseReleaseId })
      // .andWhere('force_update = :forceUpdate', { forceUpdate: FORCE_UPDATE.must_force })
      .orderBy('destination_rs.build_number', 'DESC')
      .getRawMany();
  }
}
