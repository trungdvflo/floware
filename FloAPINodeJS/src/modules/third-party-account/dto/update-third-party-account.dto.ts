import { OmitType } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsPort } from 'class-validator';
import { IsEmailOrEmpty, IsOptionalCustom } from '../../../common/decorators';
import { formatMessageInvalid } from '../../../common/utils/common';
import { ACCOUNT_TYPE, AUTH_TYPE } from '../contants';
import { IThirdPartyAccountDto } from './third-party-account.dto';
export class UpdateThirdPartyAccountDto extends OmitType(IThirdPartyAccountDto,
    ['user_id'] as const) {

  @Expose()
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsOptionalCustom()
  updated_date: number = new Date().getTime() / 1000;

  @Expose()
  @IsOptionalCustom()
  @IsPort({
    message: formatMessageInvalid
  })
  port_smtp: number;

  @Expose()
  @IsOptionalCustom()
  @IsEnum(ACCOUNT_TYPE, {
    message: formatMessageInvalid
  })
  account_type: ACCOUNT_TYPE;

  @Expose()
  @IsOptionalCustom()
  @IsEmailOrEmpty()
  user_income: string;

  @Expose()
  @IsOptionalCustom()
  @IsEnum(AUTH_TYPE,{
    message: formatMessageInvalid
  })
  auth_type: AUTH_TYPE;

}