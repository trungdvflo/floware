import { getRepository } from 'typeorm';
import { DeviceToken } from '../../entities/mail/device-token.entity';

export interface DeviceTokenServiceOptions {
  fields: (keyof DeviceToken)[];
}
export class DeviceTokenService {
  private readonly quota = getRepository(DeviceToken, 'mail');

  /**
   * Delete items by user name
   * @param username
   * @returns
   */
  deleteByUserName(username: string) {
    return this.quota.delete({ username });
  }
}
