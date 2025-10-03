import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';

export class ParamPlatformSettingDto {

  @IsOptionalCustom()
  @IsNumberString()
  user_id: number;

  @IsOptionalCustom()
  @IsString()
  app_reg_id: string;

  @IsNotEmpty()
  @IsString()
  app_version: string;
}
