import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SETTING_NAME } from './setting.dto';

export class SettingItem {
  @IsNotEmpty()
  @IsEnum(SETTING_NAME)
  name: string;

  @IsString()
  @IsOptional()
  channel?: string;

  @IsNotEmpty()
  value: string;
}

export class SettingsParam {
  @IsNotEmpty()
  settings: SettingItem[];
}

export class ChannelItemParam {
  @IsString()
  @IsOptional()
  channelName: string;
}
