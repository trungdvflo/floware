import { lorem } from 'faker';
import { CreatePlatformSettingDto } from '../dto/create-platform-setting.dto';
import { ParamPlatformSettingDto } from '../dto/param-platform-setting.dto';
import { UpdatePlatformSettingDto } from '../dto/update-platform-setting.dto';

export function app_version() : ParamPlatformSettingDto {
  const p = new ParamPlatformSettingDto();
  p.app_version = '3.0.0';
  return p;
}

export function createEntity(): CreatePlatformSettingDto {
  const body = new CreatePlatformSettingDto();
  body.app_reg_id = lorem.word(10);
  body.app_version = lorem.word(10);
  body.data_setting = {
    show_setting: 1,
    confirm_delete: 1
  };
  body.user_id = 1080;
  return body;
}

export function updateEntity(id?: number): UpdatePlatformSettingDto {
  const body = new UpdatePlatformSettingDto();
  body.id = id || 1;
  body.app_reg_id = lorem.word(10);
  body.app_version = lorem.word(10);
  body.data_setting = {
    show_setting: 1,
    confirm_delete: 1
  };
  body.user_id = 1080;
  return body;
}

export function fakeCreatedUserResult(): UpdatePlatformSettingDto {
  const body = new UpdatePlatformSettingDto();
  body.id = 1;
  body.app_reg_id = lorem.word(10);
  body.app_version = lorem.word(10);
  body.data_setting = {
    show_setting: 1,
    confirm_delete: 1
  };
  body.user_id = 1080;
  return body;
}