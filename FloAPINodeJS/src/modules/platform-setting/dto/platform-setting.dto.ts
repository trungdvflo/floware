import { Exclude } from 'class-transformer';
import {
  IsNotEmpty, IsNotEmptyObject, IsNumber, IsObject, IsString,
  NotEquals
} from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';
import { PlatformSetting } from '../../../common/entities/platform-setting.entity';
import { formatMessageInvalid } from '../../../common/utils/common';

export class IPlatformSettingDto {

  // dto data return user
  constructor(partial?: Partial<PlatformSetting>) {
    Object.assign(this, partial);
  }

  @IsString({
    message: formatMessageInvalid
  })
  @IsOptionalCustom()
  @Exclude()
  app_reg_id: string;

  @Exclude() // remove when return data
  @IsOptionalCustom() // this filed option can be remove
  @IsNumber()
  user_id: number;

  @IsObject({
    message: formatMessageInvalid
  })
  @IsNotEmpty({
    message: formatMessageInvalid
  })
  @NotEquals('null', {
    message: formatMessageInvalid
  })
  @NotEquals(null, {
    message: formatMessageInvalid
  })
  @IsNotEmptyObject({
    nullable: false
  },{
    message: formatMessageInvalid
  })
  data_setting: object;

}