import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Json } from 'aws-sdk/clients/marketplacecatalog';
import * as Re2 from "re2";
import { Repository } from 'typeorm';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_DATA_INVALID,
  MSG_ERR_ALREADY_EXIST_DEVICE_TOKEN,
  MSG_ERR_BAD_REQUEST,
  MSG_ERR_NOT_EXIST,

  MSG_ERR_NO_DEVICE_TOKEN
} from '../../common/constants/message.constant';
import { ErrorDTO } from '../../common/dtos/error.dto';
import { AccessToken } from '../../common/entities/access-token.entity';
import { Devicetoken } from '../../common/entities/devicetoken.entity';
import { Release } from '../../common/entities/release.entity';
import { UserPlatformVersion } from '../../common/entities/user-platform-version.entity';
import { IReq } from '../../common/interfaces';
import { ApnPush, ApnVoipPush } from '../../common/utils/apn.util';
import { AsyncForEach } from '../../common/utils/common';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { buildSingleResponseErr } from '../../common/utils/respond';
import { buildSelectFields, buildWhereConditions } from '../../common/utils/typeorm.util';
import cfApp from '../../configs/app';
import cfAws from '../../configs/aws';
import { OAuthService } from '../oauth/oauth.service';
import { DeviceTokenEmailService } from './devicetoken.email';
import { CreateDeviceTokenDTO } from './dtos/create-devicetoken.dto';
import { DeleteDevicetokenDTO } from './dtos/delete-devicetoken.dto';
import { GetDevicetokenDTO } from './dtos/get-devicetoken.request';
import { SilentPushDTO } from './dtos/slient-push.dto';
import { UpdateDevicetokenDTO } from './dtos/update-devicetoken.dto';

@Injectable()
export class DevicetokenService {
  private readonly mailServerUrl: string;
  private readonly apnKeyPath: string;
  private readonly apnKeyVoip: Json;
  private readonly apnKeyMap: Json;

  constructor(
    @InjectRepository(Devicetoken) private readonly devicetokenRepository: Repository<Devicetoken>,
    @InjectRepository(Release) private readonly releaseRepository: Repository<Release>,
    @InjectRepository(AccessToken) private readonly accessTokenRepository: Repository<AccessToken>,
    @InjectRepository(UserPlatformVersion)
    private readonly userPlatformVersionRepository: Repository<UserPlatformVersion>,
    private readonly oAuthService: OAuthService,
    private readonly deviceTokenEmailService: DeviceTokenEmailService,
  ) {
    this.mailServerUrl = cfApp().serverMailUrl;
    this.apnKeyPath = cfAws().apnKeyPath;
    this.apnKeyVoip = cfAws().apnKeyVoip ? JSON.parse(cfAws().apnKeyVoip) : '';
    this.apnKeyMap = cfAws().apnKeyMap ? JSON.parse(cfAws().apnKeyMap) : '';
  }

  async findOne(userId: number, devicetoken: string) {
    return this.devicetokenRepository.findOne({
      where: {
        user_id: userId,
        device_token: devicetoken,
      },
    });
  }

  async findAll(filter: GetDevicetokenDTO, { user, headers }: IReq) {
    try {
      const { modified_gte, modified_lt, min_id, page_size, fields } = filter;

      const data = await this.devicetokenRepository.find({
        select: buildSelectFields(this.devicetokenRepository, fields)
          .filter(f => f !== 'device_uuid'),
        where: buildWhereConditions({
          userId: user.id,
          modified_gte,
          modified_lt,
          ids: null,
          min_id,
        }),
        skip: 0,
        take: page_size,
      });

      return {
        data,
      };
    } catch (err) {
      throw new BadRequestException({
        code: ErrorCode.INVALID_DATA,
        message: MSG_DATA_INVALID
      });
    }
  }

  async remove(devicetoken: DeleteDevicetokenDTO, { user, headers }: IReq) {
    let error: ErrorDTO = null;
    try {
      let removed;

      const found = await this.findOne(user.userId, devicetoken.device_token);

      if (!found) {
        error = new ErrorDTO({
          attributes: devicetoken,
          code: ErrorCode.DEVICE_TOKEN_DOES_NOT_EXIST,
          message: MSG_ERR_NOT_EXIST,
        });
      } else {
        const deleteResult = await this.devicetokenRepository.delete(found.id);
        if (deleteResult && deleteResult.affected) {
          removed = devicetoken;
          try {
            await this.deviceTokenEmailService.removeDevicetoken(devicetoken, user.email);
          } catch (err) {
            // TODO: log error here
          }
        } else {
          error = new ErrorDTO({
            attributes: devicetoken,
            code: ErrorCode.DEVICE_TOKEN_DOES_NOT_EXIST,
            message: MSG_ERR_NOT_EXIST,
          });
        }
      }
      return {
        removed,
        error,
      };
    } catch (err) {
      return {
        error: new ErrorDTO({
          attributes: devicetoken,
          code: ErrorCode.BAD_REQUEST,
          message: MSG_ERR_BAD_REQUEST,
        }),
      };
    }
  }

  async checkReleaseAndUserPlatform(userAppId: string, buildNumber: number, versionStr: string) {
    const aliasName = 'rl';
    const aliasUserPl = 'upl';
    const query = this.releaseRepository.createQueryBuilder(aliasName)
      .select([`${aliasName}.id AS releaseId`, `${aliasUserPl}.id AS userPlatformVersionId`])
      .leftJoin(UserPlatformVersion, aliasUserPl, `${aliasUserPl}.platform_release_version_id = ${aliasName}.id`)
      .where(`${aliasName}.app_id = :userAppId AND ${aliasName}.build_number = :buildNumber AND ${aliasName}.version = :version_str`,
        { userAppId, buildNumber, version_str: versionStr });
    return query.getRawOne();
  }

  async create(dto: CreateDeviceTokenDTO, { user, headers }: IReq) {
    const currentTime = getUtcMillisecond();
    const dateItem = getUpdateTimeByIndex(currentTime, 0);
    try {
      const existDt = await this.devicetokenRepository.findOne({
        select: ['id', 'device_token', 'user_id'],
        where: { device_token: dto.device_token }
      });
      if (existDt) {
        if (existDt.user_id === user.userId) {
          return {
            error: new ErrorDTO({
              attributes: dto,
              code: ErrorCode.ALREADY_EXIST_DEVICE_TOKEN,
              message: MSG_ERR_ALREADY_EXIST_DEVICE_TOKEN,
            }),
          };
        }
        // Remove device when user_id is changed
        await this.devicetokenRepository.delete({
          id: existDt.id
        });
      }

      const str_build_number = user.userAgent.match(/build [0-9]{1,}/);
      let buildNumber = 0;
      if (str_build_number) {
        buildNumber = Number(str_build_number[0].match(/[0-9]{1,}/)[0]);
      }
      const str_flo_version = user.userAgent.match(new Re2(/Flo\/[0-9]+(\.[0-9]+)*/));
      let version_str = '';
      if (str_flo_version) {
        version_str = str_flo_version[0].match(new Re2(/[0-9]+(\.[0-9]+)*/))[0];
      }

      const [rsRelease] = await Promise.all([
        this.checkReleaseAndUserPlatform(user.appId, buildNumber, version_str),
        this.accessTokenRepository.update({
          user_id: user.userId,
          app_id: user.appId,
          device_uid: user.deviceUid,
        }, { device_token: dto.device_token }),
        this.oAuthService.updateAuthCacheByToken(user.token, dto.device_token)
      ]);

      const promises = [];
      const deviceTokenData = this.devicetokenRepository.create({
        user_id: user.userId,
        ...dto,
        device_uuid: user.deviceUid,
        created_date: dateItem,
        updated_date: dateItem,
      });
      promises.push(this.devicetokenRepository.save(deviceTokenData));
      const createDeviceToken = await this.deviceTokenEmailService
        .createDevicetoken(dto, user.email);
      promises.push(createDeviceToken);
      if (rsRelease && !rsRelease.userPlatformVersionId) {
        const uPlfVerEntity = this.userPlatformVersionRepository.create({
          user_id: user.userId,
          app_id: user.appId,
          platform_release_version_id: rsRelease.releaseId,
          device_token: dto.device_token,
          user_agent: user.userAgent,
          created_date: dateItem,
          updated_date: dateItem,
        });
        promises.push(this.userPlatformVersionRepository.save(uPlfVerEntity));
      }

      const [resDeviceToken] = await Promise.all(promises);
      if (dto.ref) resDeviceToken['ref'] = dto.ref;
      delete resDeviceToken.device_uuid;
      return {
        data: resDeviceToken
      };
    } catch (err) {
      return {
        error: new ErrorDTO({
          attributes: dto,
          code: ErrorCode.CREATE_FAILED,
          message: MSG_ERR_BAD_REQUEST,
        }),
      };
    }
  }

  async update(dto: UpdateDevicetokenDTO, { user, headers }: IReq) {
    try {
      const currentTime = getUtcMillisecond();
      const dateItem = getUpdateTimeByIndex(currentTime, 0);
      const itemdDeviceToken = await this.devicetokenRepository.findOne({
        where: {
          user_id: user.userId,
          device_token: dto.device_token
        }
      });
      if (itemdDeviceToken) {
        const entity = this.devicetokenRepository.create({
          ...itemdDeviceToken,
          ...dto,
          updated_date: dateItem,
        });
        if (dto.replied === 1) {
          entity.time_received_silent = dateItem;
        } else {
          entity.time_received_silent = dto.time_received_silent;
        }
        let error: ErrorDTO = null;
        let updated;
        const result = await this.devicetokenRepository.update(
          {
            device_token: dto.device_token,
            user_id: user.userId,
          },
          entity,
        );
        if (result && result.affected) {
          updated = {
            ...entity,
          };
          try {
            await this.deviceTokenEmailService.updateDevicetoken(dto, user.email);
          } catch (err) {
            // TODO: log error here
          }
        } else {
          error = new ErrorDTO({
            attributes: dto,
            code: ErrorCode.DEVICE_TOKEN_DOES_NOT_EXIST,
            message: MSG_ERR_NOT_EXIST,
          });
        }
        return { data: entity };
      } else {
        return {
          error: new ErrorDTO({
            attributes: dto,
            code: ErrorCode.DEVICE_TOKEN_DOES_NOT_EXIST,
            message: MSG_ERR_NOT_EXIST,
          }),
        };
      }
    } catch (err) {
      return {
        error: new ErrorDTO({
          attributes: dto,
          code: ErrorCode.UPDATE_FAILED,
          message: MSG_ERR_BAD_REQUEST,
        }),
      };
    }
  }

  async sendCallEvent(data: SilentPushDTO) {
    try {
      const { invitee } = data;
      const emails = invitee.map(i => i.email);
      const devices = await this.devicetokenRepository
        .createQueryBuilder("d")
        .select(['d.device_token as device_token'
          , 'd.cert_env as cert_env'
          , 'd.device_type as device_type'
          , 'd.env_silent as env_silent'
          , 'u.username as username'])
        .innerJoin("user", "u", "u.id=d.user_id")
        .where("u.username IN (:...emails)", { emails })
        .getRawMany();
      if (devices.length > 0) {
        if (data.invite_status === 1) {
          await AsyncForEach(this.apnKeyVoip, async (bundleId, key) => {
            await ApnVoipPush(data, devices, key, bundleId, false, this.apnKeyPath);
          });
        } else {
          await AsyncForEach(this.apnKeyMap, async (bundleId, key) => {
            await ApnPush(data, devices, key, bundleId, false, this.apnKeyPath);
          });
        }
        return {
          data: devices
        };
      }
      throw new BadRequestException(
        buildSingleResponseErr(ErrorCode.DEVICE_TOKEN_DOES_NOT_EXIST,
          MSG_ERR_NO_DEVICE_TOKEN, data),
      );
    } catch (err) {
      throw new BadRequestException(
        buildSingleResponseErr(ErrorCode.INVALID_DATA,
          MSG_DATA_INVALID, data),
      );
    }
  }
}