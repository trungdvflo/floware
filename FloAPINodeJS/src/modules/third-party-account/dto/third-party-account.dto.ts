import { OmitType } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';
import { IsEnum, IsIn, IsNumber, IsPort, IsString, ValidateNested } from 'class-validator';
import { IsEmailOrEmpty, IsOptionalCustom } from '../../../common/decorators';
import { ThirdPartyAccount } from '../../../common/entities/third-party-account.entity';
import { formatMessageInvalid } from '../../../common/utils/common';
import { AUTH_TYPE } from '../contants';

export class TypeAccountSync {
  @Expose()
  @IsOptionalCustom()
  @IsIn([0,1])
  Email: number;

  @Expose()
  @IsOptionalCustom()
  @IsIn([0,1])
  Calendar: number;

  @Expose()
  @IsOptionalCustom()
  @IsIn([0,1])
  Contact : number;
}

export class IThirdPartyAccountDto extends OmitType(ThirdPartyAccount,[]){

  // dto data return user
  constructor(partial?: Partial<ThirdPartyAccount>) {
    super();
    Object.assign(this, partial);
  }
  @IsOptionalCustom()
  @Exclude()
  @IsString({
    message: formatMessageInvalid
  })
  pass_income: string;

  @Exclude()
  @IsOptionalCustom()
  @IsString({
    message: formatMessageInvalid
  })
  pass_smtp: string;

  @Exclude() // remove when return data
  @IsOptionalCustom() // this filed option can be remove
  @IsNumber()
  user_id: number;

  @Expose()
  @IsOptionalCustom()
  @IsEnum(AUTH_TYPE)
  auth_type_smtp: AUTH_TYPE;

  @Expose()
  @IsOptionalCustom()
  @IsEmailOrEmpty()
  user_smtp: string;

  @Expose()
  @IsOptionalCustom()
  @IsPort({
    message: formatMessageInvalid
  })
  port_income: number;

  @Expose()
  @IsOptionalCustom()
  @IsEmailOrEmpty()
  user_caldav: string;

  @Expose()
  @IsOptionalCustom()
  @IsPort({
    message: formatMessageInvalid
  })
  port_caldav: number;

  @Expose()
  @IsOptionalCustom()
  @ValidateNested({ each: true})
  account_sync: TypeAccountSync;

}
