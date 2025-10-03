import { Injectable } from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { IUser } from '../../interface/user.interface';
import { SETTING_NAME, SETTING_VALUE } from '../../setting/setting.dto';
import { Setting } from '../entities/setting.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class SettingRepository extends BaseRepository<Setting> {
  constructor(dataSource: DataSource) {
    super(Setting, dataSource);
  }

  async getSettingValue(user: IUser, name: string) {
    const userSetting = await this.findOneBy({ email: user.email, name });
    return userSetting?.value || null;
  }

  async getUserChannelSetting(email: string, channel: string) {
    return await this.findBy({ email, channel });
  }

  async getUserSetting(email: string) {
    return await this.findBy({ email, channel: IsNull() });
  }

  getDefaultSettings() {
    return [
      {
        name: SETTING_NAME.CHAT_NOTIFICATION,
        value: SETTING_VALUE.ON
      },
      {
        name: SETTING_NAME.CHAT_TYPING,
        value: SETTING_VALUE.ON
      },
      {
        name: SETTING_NAME.CHAT_NOTIFICATION_HIDE_MESSAGE,
        value: SETTING_VALUE.OFF
      },
    ];
  }
}
