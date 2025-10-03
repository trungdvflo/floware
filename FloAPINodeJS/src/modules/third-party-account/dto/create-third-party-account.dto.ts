import { ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import {
  IsDefined, IsEmail, IsEnum, IsInt, IsNotEmpty,
  IsNumber, IsNumberString, IsPort, IsString, ValidateNested
} from 'class-validator';
import { IsEmailOrEmpty, IsOptionalCustom } from '../../../common/decorators';
import { formatMessageInvalid } from '../../../common/utils/common';
import { ACCOUNT_TYPE, AUTH_TYPE, USE_SSL } from '../contants';
import { TypeAccountSync } from './third-party-account.dto';
export class CreateThirdPartyAccountDto {

  // @Exclude()
  // id?: number;
  @Expose()
  @IsOptionalCustom()
  @ApiPropertyOptional({
    example: 'imap.gmail.com'
  })
  server_income?: string;

  @Expose()
  @IsOptionalCustom()
  @IsEnum(USE_SSL)
  use_ssl_income?: USE_SSL;

  @Expose()
  @IsOptionalCustom()
  @IsInt()
  type_income?: number;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  server_smtp?: string;

  @Expose()
  @IsOptionalCustom()
  @IsEnum(USE_SSL)
  use_ssl_smtp?: USE_SSL;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  server_caldav?: string;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  server_path_caldav?: string;

  @Expose()
  @IsOptionalCustom()
  @IsEnum(USE_SSL)
  use_ssl_caldav?: USE_SSL;

  @Expose()
  @IsOptionalCustom()
  use_kerberos_caldav?: number;

  @Expose()
  @IsOptionalCustom()
  auth_key?: string;

  @Expose()
  @IsOptionalCustom()
  auth_token?: string;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  full_name?: string;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  description?: string;

  @Expose()
  @IsOptionalCustom()
  refresh_token?: string;

  @Expose()
  @IsOptionalCustom()
  provider?: string;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  icloud_user_id?: string;

  @Expose()
  @IsOptionalCustom()
  @IsEmail()
  email_address?: string;

  @Expose()
  @IsOptionalCustom()
  token_expire?: number;

  @Expose()
  @IsOptionalCustom()
  activated_push?: number;

  @Expose()
  @IsOptionalCustom()
  @IsString()
  signature?: string;

  @IsOptionalCustom()
  @Exclude()
  @IsString({
    message: formatMessageInvalid
  })
  pass_income?: string;

  @Exclude()
  @IsOptionalCustom()
  @IsString({
    message: formatMessageInvalid
  })
  pass_smtp?: string;

  @Exclude() // remove when return data
  @IsOptionalCustom() // this filed option can be remove
  @IsNumber()
  user_id?: number;

  @Expose()
  @IsOptionalCustom()
  @IsEnum(AUTH_TYPE)
  auth_type_smtp?: AUTH_TYPE;

  @Expose()
  @IsOptionalCustom()
  @IsEmailOrEmpty()
  user_smtp?: string;

  @Expose()
  @IsOptionalCustom()
  @IsNumberString()
  @IsPort({
    message: formatMessageInvalid
  })
  port_income?: number;

  @Expose()
  @IsOptionalCustom()
  @IsEmailOrEmpty()
  user_caldav?: string;

  @Expose()
  @IsOptionalCustom()
  @IsNumberString()
  @IsPort({
    message: formatMessageInvalid
  })
  port_caldav?: string;

  @Expose()
  @IsOptionalCustom()
  @ValidateNested({ each: true })
  account_sync?: TypeAccountSync;

  @Exclude()
  @IsOptionalCustom()
  created_date?: number = new Date().getTime() / 1000;

  @IsOptionalCustom()
  updated_date?: number = this.created_date;

  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsNumberString()
  @IsPort({
    message: formatMessageInvalid
  })
  port_smtp: string;

  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(ACCOUNT_TYPE, {
    message: formatMessageInvalid
  })
  account_type: ACCOUNT_TYPE;

  @Expose()
  @IsNotEmpty()
  @IsEmailOrEmpty()
  @IsDefined()
  user_income: string;

  @Expose()
  @IsDefined()
  @IsNotEmpty()
  @IsEnum(AUTH_TYPE, {
    message: formatMessageInvalid
  })
  auth_type: AUTH_TYPE;

  @ApiPropertyOptional({
    example: "3700A1BD-EB0E-4B8E-84F9-06D63D672D2C"
  })
  @IsString()
  @IsOptionalCustom()
  @Expose()
  ref?: string;
}
