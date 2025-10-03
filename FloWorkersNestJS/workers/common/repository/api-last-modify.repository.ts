import { Injectable } from "@nestjs/common";
import { LastModifyEntity } from "../../worker-api-last-modify/models/api-last-modified.entity";
import { DevicetokenEntity } from "../../worker-api-last-modify/models/devicetoken.entity";
import { PUSH_CHANGE_CONFIG } from "../constants/common.constant";
import { SEND_LAST_MODIFY_CONFERENCE, SEND_LAST_MODIFY_SHARE } from "../constants/mysql.constant";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { ILastModify } from "../interface/api-last-modify.interface";
import { getPlaceholderByN } from "../utils/common";
import { Graylog } from "../utils/graylog";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(LastModifyEntity)
export class LastModifyRepository extends BaseRepository<LastModifyEntity> {

  async getLastTime(userId: number, apiName: string) {
    const rs = await this.findOne({ where: {
      user_id: userId,
      api_name: apiName
    }});

    return rs?.api_modified_date? rs.api_modified_date : 0;
  }

  async sendLastModifyForShareCollection({ api_name, collection_id, updated_date }: ILastModify) {
    try {
      if (!collection_id) {
        return 0;
      }
      const { spName, spParam } = SEND_LAST_MODIFY_SHARE;
      const saved = await this.manager
        .query(`SELECT ${spName}(${getPlaceholderByN(spParam)}) id`, [
          api_name,
          collection_id,
          updated_date
        ]);
      return saved[0];
    } catch (error) {
      return { error };
    }
  }

  async sendLastModifyForShareConference({ api_name, channel_id, updated_date }: ILastModify) {
    try {
      if (!channel_id) {
        return 0;
      }
      const { spName, spParam } = SEND_LAST_MODIFY_CONFERENCE;
      const saved = await this.manager
        .query(`SELECT ${spName}(${getPlaceholderByN(spParam)}) id`, [
          api_name,
          channel_id,
          updated_date
        ]);
      return saved[0];
    } catch (error) {
      return { error };
    }
  }
}

@Injectable()
@CustomRepository(DevicetokenEntity)
export class DeviceTokenRepository extends BaseRepository<DevicetokenEntity> {
  async getListDeviceByUser(userIds: number[]) {
    try {
      const deviceTokens = await this.createQueryBuilder()
        .select('id, user_id, device_token, env_silent, CONCAT(device_type, cert_env) as pem')
        .where('user_id IN (:...userIds)', { userIds })
        .andWhere('(time_sent_silent - time_received_silent) <= :interval_stop_push', {
          interval_stop_push: PUSH_CHANGE_CONFIG.INTERVAL_STOP_PUSH
        })
        .andWhere('env_silent IN (:...env_silents)', {
          env_silents: PUSH_CHANGE_CONFIG.SILENT_VALID
        })
        .andWhere('device_type >= 0')
        .andWhere('cert_env >= 0')
        .getRawMany();

      return deviceTokens;
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: 'Device token',
        jobName: 'getListDeviceByUser',
        message: error.code,
        fullMessage: error.message
      });
      return error;
    }
  }
}