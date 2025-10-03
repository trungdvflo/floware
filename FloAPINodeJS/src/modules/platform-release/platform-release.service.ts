import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan } from 'typeorm';
import { APP_IDS, RELEASE_STATUS, UPLOAD_STATUS } from '../../common/constants';
import { PlatformReleasePushNotification } from '../../common/entities/platform-release-push-notifications.entity';
import { PlatformReleasePushNotificationRepository } from '../../common/repositories/platform-release-push-notification.repository';
import { ReleaseRepository } from '../../common/repositories/release.repository';
import { Utils } from '../../common/utils/common';
import { getUtcSecond } from '../../common/utils/date.util';
import { VersionUtil } from '../../common/utils/version.util';
import uploadConfig from '../../configs/upload.config';
import { GetPlatformReleaseDto, GetPlatformReleaseResponse } from './dto/get-platform-release.dto';

@Injectable()
export class PlatformReleaseService {
  constructor(
    @InjectRepository(PlatformReleasePushNotification)
    private readonly rsPushNotificationRepository: PlatformReleasePushNotificationRepository,

    @InjectRepository(ReleaseRepository)
    private readonly releaseRepository: ReleaseRepository,
  ) { }

  async getForcedUpdateRelease(
    getPlatformReleaseDto: GetPlatformReleaseDto,
    appId: string
  ): Promise<GetPlatformReleaseResponse> {
    try {
      const baseReleaseCondition = {
        build_number: getPlatformReleaseDto.build_number,
        app_id: appId,
        release_status: RELEASE_STATUS.published,
        expire_date: MoreThan(0)
      };
      if (getPlatformReleaseDto.version) {
        baseReleaseCondition['version'] = getPlatformReleaseDto.version;
      }
      const baseRelease = await this.releaseRepository.findOne({
        select: ['id', 'expire_date', 'message_expire', 'version'],
        where: baseReleaseCondition
      });
      if (!baseRelease || baseRelease.length <= 0) {
        return {
          data: {}
        };
      }

      const destinationReleaseCondition = {
        build_number: MoreThan(getPlatformReleaseDto.build_number),
        app_id: appId,
        release_status: RELEASE_STATUS.published,
      };
      if (appId === APP_IDS.mac) {
        destinationReleaseCondition['upload_status'] = UPLOAD_STATUS.successed;
      }
      const destinationReleases = await this.releaseRepository.find({
        select: ['app_id', 'build_number', 'version', 'title', 'message', 'created_date', 'updated_date'
        , 'os_support', 'checksum', 'release_time', 'release_note', 'length', 'file_uid', 'url_download'],
        where: destinationReleaseCondition
      });
      if (!destinationReleases || destinationReleases.length <= 0) {
        return {
          data: {}
        };
      }
      const versions = destinationReleases.map(r => r.version);
      const maxVersion = VersionUtil.getMaxVersion(versions);
      if (VersionUtil.compareVersion(baseRelease.version, maxVersion, '>')) {
        return {
          data: {}
        };
      }
      const versionsRelease = destinationReleases.filter(r => r.version === maxVersion);
      const buildNumbers = versionsRelease.map(r => r.build_number);
      const maxBuildNumber = Math.max(...buildNumbers);
      const versionRelease = versionsRelease.find(r => r.build_number === maxBuildNumber);
      const url_download = versionRelease.url_download? versionRelease.url_download
      : Utils.generateDownloadUrl(versionRelease.file_uid, appId);
      const is_expired = (getUtcSecond() >= baseRelease.expire_date)?
        1 : 0;
      const configExpire = uploadConfig().s3DownloadExpireTime;
      const url_download_expire = getUtcSecond() + Number(configExpire);

      return {
        data: {
          app_id: versionRelease.app_id,
          version: versionRelease.version,
          build_number: versionRelease.build_number,
          title: versionRelease.title,
          message: versionRelease.message,
          url_download,
          url_download_expire,
          created_date: versionRelease.created_date,
          updated_date: versionRelease.updated_date,
          os_support: versionRelease.os_support,
          checksum: versionRelease.checksum,
          release_note: versionRelease.release_note,
          release_time: versionRelease.release_time,
          length: versionRelease.length,

          force_update: 1,

          old_build_expire: baseRelease.expire_date,
          is_expired,
          message_expire: baseRelease.message_expire,
        }
      };
    } catch (error) {
      return {
        data: {}
      };
    }

  }

  async getForcedUpdateRelease2(
    getPlatformReleaseDto: GetPlatformReleaseDto,
    appId: string
  ): Promise<GetPlatformReleaseResponse> {

    const baseReleaseCondition = {
      build_number: getPlatformReleaseDto.build_number,
      app_id: appId,
      release_status: RELEASE_STATUS.published
    };
    if (getPlatformReleaseDto.version) {
      baseReleaseCondition['version'] = getPlatformReleaseDto.version;
    }
    const baseRelease = await this.releaseRepository.findOne({
      select: ['id', 'release_time'],
      where: baseReleaseCondition
    });

    if (!baseRelease || baseRelease.length <= 0) {
      return {
        data: {}
      };
    }
    const results = await this.rsPushNotificationRepository.getForceUpdateReleases(
      baseRelease.id,
      getPlatformReleaseDto
    );

    if (!results || results.length <= 0) {
      return {
        data: {}
      };
    }
    const versions = results.map(r => r.version);
    const maxVersion = VersionUtil.getMaxVersion(versions);
    const versionRelease = results.find(r => r.version === maxVersion);
    const url_download = versionRelease.url_download? versionRelease.url_download
        : Utils.generateDownloadUrl(versionRelease.file_uid, appId);

    return {
      data: {
        app_id: versionRelease.app_id,
        version: versionRelease.version,
        build_number: versionRelease.build_number,
        title: versionRelease.title,
        message: versionRelease.message,
        url_download,
        force_update: Number(versionRelease.force_update),
        created_date: versionRelease.created_date,
        updated_date: versionRelease.updated_date,
        os_support: versionRelease.os_support,
        checksum: versionRelease.checksum,
        release_note: versionRelease.release_note,
        release_time: baseRelease.release_time,
        length: versionRelease.length
      }
    };
  }
}
