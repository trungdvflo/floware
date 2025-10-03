import { Injectable } from '@nestjs/common';
import { SettingRepository } from '../database/repositories';
import { IUser } from '../interface/user.interface';
import { SettingItem } from './setting-param.request';
import { SettingDto } from './setting.dto';
@Injectable()
export class SettingService {
  constructor(private readonly settingRepo: SettingRepository) {}

  async updateSetting(setting: SettingItem, user: IUser) {
    let settingEntity = await this.settingRepo.findOneBy({
      name: setting.name,
      channel: setting.channel,
      email: user.email,
    });
    if (!settingEntity?.id) {
      settingEntity = this.settingRepo.create({
        name: setting.name,
        channel: setting.channel,
        email: user.email,
      });
    }
    settingEntity.value = setting.value;
    await this.settingRepo.save(settingEntity);
    return {
      data: {
        messsage: 'update setting success',
        name: setting.name,
      },
    };
  }
  async getChannelSetting(email: string, channel: string) {
    const channelSetting = await this.settingRepo.getUserChannelSetting(email, channel);
    const defaultSetting = await this.getUserSetting(email);
    return this.mergeSetting(defaultSetting, channelSetting);
  }

  async getUserSetting(email: string) {
    const userSetting = await this.settingRepo.getUserSetting(email);
    const defaultSetting = this.settingRepo.getDefaultSettings();

    if (userSetting.length) {
      const settings = userSetting.map((setting) => {
        return { name: setting.name, value: setting.value };
      });
      const names = userSetting.map((setting) => {
        return setting.name;
      });
      for (const s of defaultSetting) {
        if (!names.includes(s.name)) {
          settings.push(s);
        }
      }

      return settings;
    }
    return defaultSetting;
  }

  async mergeSetting(defaultSetting, userSetting) {
    const settings = {};
    for (const setting of defaultSetting) {
      settings[setting.name] = setting.value;
    }
    for (const setting of userSetting) {
      settings[setting.name] = setting.value;
    }
    return settings;
  }

  async loadUserSetting(email: string) {
    const userSettings = await this.getUserSetting(email);
    const settings = {};
    for (const setting of userSettings) {
      settings[setting.name] = setting.value;
    }
    return new SettingDto(email, settings);
  }

  async loadChannelSetting(email: string, channel: string) {
    const channelSettings = await this.getChannelSetting(email, channel);
    return new SettingDto(email, channelSettings);
  }
}
