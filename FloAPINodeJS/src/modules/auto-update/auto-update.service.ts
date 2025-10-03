import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Readable } from 'stream';
import { Equal, In, LessThan, Repository } from 'typeorm';
import { CONFIGS, RELEASE_STATUS } from '../../common/constants/common';
import { ErrorCode } from '../../common/constants/error-code';
import { AppRegister } from '../../common/entities/app-register.entity';
import { Config } from '../../common/entities/config.entity';
import { GroupsUser } from '../../common/entities/group-user.entity';
import { Release } from '../../common/entities/release.entity';
import { ReleasesGroup } from '../../common/entities/releases-groups.entity';
import { ReleasesUser } from '../../common/entities/releases-user.entity';
import { IUser } from '../../common/interfaces';
import { Utils } from '../../common/utils/common';
import { S3Util, S3Utility } from '../../common/utils/s3.util';
import { VersionUtil } from '../../common/utils/version.util';
import cfgAWS from '../../configs/aws';
import uploadConfig from '../../configs/upload.config';
import { AutoUpdateConstants } from './auto-update.constant';
import { GetDownloadDto } from './dtos/download.get.dto';
import { GetVersionDto } from './dtos/version.get.dto';

@Injectable()
export class AutoUpdateService {
  private s3Util: S3Utility;

  constructor(
    @InjectRepository(Release)
    private readonly releasesRepository: Repository<Release>,
    @InjectRepository(GroupsUser)
    private readonly groupUserRepository: Repository<GroupsUser>,
    @InjectRepository(ReleasesGroup)
    private readonly releasesGroupsRepository: Repository<ReleasesGroup>,
    @InjectRepository(ReleasesUser)
    private readonly releasesUserRepository: Repository<ReleasesUser>,
    @InjectRepository(AppRegister)
    private readonly appRegisterRepository: Repository<AppRegister>,
    @InjectRepository(Config)
    private readonly configRepository: Repository<Config>,
  ) {
    this.s3Util = S3Util({
      endpoint: cfgAWS().s3Endpoint,
      region: cfgAWS().s3Region,
      accessKeyId: cfgAWS().s3AccessKeyId,
      secretAccessKey: cfgAWS().s3SecretAccessKey,
    }, cfgAWS().s3Bucket || 'bucket_name');
  }

  private getWhereDownload(getQuery: GetDownloadDto) {
    const whereObj = [
      {
        file_uid: Equal(getQuery.uuid)
      },
      {
        file_dsym_uid: Equal(getQuery.uuid)
      }
    ];

    return whereObj;
  }

  async getConfigDownloadLink() {
    let url = '';
    const config = await this.configRepository.findOne({
      where: {
        group: CONFIGS.MIGRATE_GROUP,
        key: CONFIGS.FLM_DOWNLOAD_KEY,
      }
    });
    if (config) {
      const urlObj = JSON.parse(config.value);
      url = urlObj.url;
    }
    return url;
  }

  async downloadAutoUpdate(query: GetDownloadDto): Promise<any> {
    try {
      const whereObj = this.getWhereDownload(query);

      const data = await this.releasesRepository.findOne({
        where: whereObj
      });
      if (!data || !data.file_uid) {
        return {
          code: ErrorCode.NOT_RELEASE_VERSION,
          message: AutoUpdateConstants.FILE_NOT_EXIST
        };
      }
      const sourceName = data.file_uid === query.uuid ? data.file_name : data.file_dsym;
      const parseFolder = Utils.parseFolder(query.uuid);
      const ext = sourceName.split('.').pop();
      const root_path = process.env.AUTO_UPDATE_PATH ? process.env.AUTO_UPDATE_PATH : 'auto_update';
      const source = `${root_path}/${parseFolder}/${query.uuid}/${query.uuid}.${ext}`;
      const isExistFile = await this.s3Util.FileExist(source);
      if (isExistFile === false) {
        return {
          code: ErrorCode.NOT_RELEASE_VERSION,
          message: AutoUpdateConstants.FILE_NOT_EXIST
        };
      }
      /* Download by api
      const wsa =  await this.s3.getObject({
        Bucket: this.AWS_S3_BUCKET_NAME,
        Key: source
      }).promise();
      return {
        wsa,
        sourceName
      }; // */

      // Download direct form S3
      const expire = uploadConfig().s3DownloadExpireTime;
      const dl = await this.s3Util.DownloadUrl(source, +expire);
      return {
        code: ErrorCode.REQUEST_SUCCESS,
        url: dl.url
      }; // */

      // Dowload from local server
      /*
      const rootPath = `${root_path}/${parseFolder}/${query.uuid}`;
      const listFile = await Fs.readdirSync(rootPath);
      if (listFile.length === 1) {
        const pathFile = `${rootPath}/${listFile[0]}`;
        return h.file(pathFile).header(
          'Content-Disposition'
          , `attachment; filename=${listFile[0]}`);
      }else{
        return {
          code: ErrorCode.BAD_REQUEST,
          message: AutoUpdateConstants.DOWNLOAD_ERROR
        };
      }//*/
    } catch (error) {
      return {
        code: ErrorCode.BAD_REQUEST,
        message: AutoUpdateConstants.DOWNLOAD_ERROR
      };
    }
  }

  async getLatestReleaseVersion(query: GetVersionDto, user: IUser): Promise<any> {
    try {
      const userId = user.userId;
      const groupUsers = await this.groupUserRepository.find({
        select: ["group_id"],
        where: [{
          user_id: userId
        }, {
          username: user.email
        }]
      });
      const groupIds = [];
      groupUsers.forEach((item, i) => {
        groupIds.push(item.group_id);
      });

      const releasesGroups = await this.releasesGroupsRepository.find({
        where: {
          group_id: In(groupIds)
        }
      });
      const groupReleaseIds = [];
      releasesGroups.forEach((item, i) => {
        groupReleaseIds.push(item.release_id);
      });

      const releasesUsers = await this.releasesUserRepository.find({
        where: {
          user_id: userId
        }
      });
      const userReleaseIds = [];
      releasesUsers.forEach((item, i) => {
        userReleaseIds.push(item.release_id);
      });

      const latestReleaseIds = groupReleaseIds.concat(userReleaseIds);
      const destinationReleases = await this.releasesRepository.find({
        select: ['id', 'version', 'checksum', 'release_note', 'file_name', 'file_uid',
          'app_id', 'build_number', 'os_support', 'length', 'file_dsym',
          'release_type', 'release_time', 'description'
        ],
        where: {
          id: In(latestReleaseIds),
          app_id: user.appId,
          release_status: RELEASE_STATUS.published,
          release_time: LessThan(Date.now() / 1000)
        },
        order: {
          id: 'DESC',
          release_time: 'DESC'
        }
      });
      if (!destinationReleases || destinationReleases.length === 0) {
        return {
          code: ErrorCode.NOT_RELEASE_VERSION,
          data: {
            message: AutoUpdateConstants.NOT_RELEASE_VERSION
          }
        };
      }

      const checkAppId = await this.appRegisterRepository.findOne({
        where: {
          app_reg_id: user.appId
        }
      });
      if (!checkAppId || !checkAppId.app_reg_id || !checkAppId.app_alias) {
        return {
          code: 422,
          data: {
            message: AutoUpdateConstants.APP_ID_NOT_EXIST
          }
        };
      }
      const versions = destinationReleases.map(r => r.version);
      const maxVersion = VersionUtil.getMaxVersion(versions);
      const versionsRelease = destinationReleases.filter(r => r.version === maxVersion);
      const buildNumbers = versionsRelease.map(r => r.build_number);
      const maxBuild = Math.max(...buildNumbers);
      const maxRelease = versionsRelease.find(r => r.build_number === maxBuild);

      const _link_download = maxRelease.file_uid ?
        Utils.generateDownloadUrl(maxRelease.file_uid, user.appId, user.deviceUid) : '';
      return {
        code: ErrorCode.REQUEST_SUCCESS,
        data: {
          version: maxRelease.version,
          checksum: maxRelease.checksum,
          release_note: maxRelease.release_note,
          build_number: maxRelease.build_number,
          os_support: maxRelease.os_support,
          link_download: _link_download,
          length: maxRelease.length,
          release_time: maxRelease.release_time,
          message: maxRelease.description
        }
      };
    } catch (error) {
      throw error;
    }
  }

  getReadableStream(buffer: Buffer): Readable {
    const stream = new Readable();

    stream.push(buffer);
    stream.push(null);

    return stream;
  }

}