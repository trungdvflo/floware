import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LIST_OF_DEVICE_TOKEN } from '../../common/constants';
import { getPlaceholderByN } from '../../common/utils/common';
import { DeviceToken } from '../entities/devicetoken.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class DeviceTokenRepository extends BaseRepository<DeviceToken> {
  constructor(dataSource: DataSource) {
    super(DeviceToken, dataSource);
  }
  /**
   * @param emailList 'anph@flomailnet,anph_dev@flomail.net'
   * @param DeviceType
   * @returns
   */
  async listOfDeviceToken(email: string, voip: boolean = false) {
    try {
      const { spName, spParam } = LIST_OF_DEVICE_TOKEN;
      const resp = await this.manager.query(`CALL ${spName}(${getPlaceholderByN(spParam)})`, [
        email,
        voip,
      ]);
      return resp.length && resp[0].length ? resp[0] : [];
    } catch (error) {
      return { error };
    }
  }
}
