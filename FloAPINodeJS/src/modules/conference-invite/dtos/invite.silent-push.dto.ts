import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray, IsDefined, IsEmail, IsEnum,
  IsInt, IsNotEmpty, IsObject, IsOptional,
  IsPositive,
  IsString,
  ValidateNested
} from "class-validator";
import { CALL_TYPE, SEND_STATUS } from '../../../common/constants';
import { IsOptionalCustom } from '../../../common/decorators';
import { RequestPushParam, requestPushBody } from '../../../common/swaggers/device-token.swagger';

export class InviteeParam {
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  @ApiProperty({ example: 'khoapm@flouat.net' })
  @Expose()
  public email: string;
}
export class InviteSilentPushDTO {
  @Expose()
  @IsEmail()
  @ApiProperty(RequestPushParam.organizer)
  organizer: string;

  @IsArray()
  @ApiProperty(RequestPushParam.invitee)
  @ValidateNested({ each: true })
  @Type(() => InviteeParam)
  @Expose()
  public invitee: InviteeParam[];

  @Expose()
  @IsString()
  @ApiProperty(RequestPushParam.meeting_url)
  meeting_url: string;

  @Expose()
  @IsString()
  @IsDefined()
  @IsNotEmpty()
  @ApiProperty(RequestPushParam.meeting_id)
  meeting_id: string;

  @Expose()
  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestPushParam.device_token)
  device_token?: string;

  @Expose()
  @IsInt()
  @IsPositive()
  @IsOptional()
  @ApiProperty(RequestPushParam.channel_id)
  channel_id: number;

  @Expose()
  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestPushParam.title)
  title?: string;

  @Expose()
  @IsEnum(SEND_STATUS)
  @ApiProperty(RequestPushParam.invite_status)
  invite_status: number;

  @Expose()
  @IsEnum(CALL_TYPE)
  @ApiProperty(RequestPushParam.call_type)
  call_type: number;

  @IsString()
  @IsOptionalCustom()
  @ApiPropertyOptional()
  @Expose()
  external_meeting_id?: string;

  sender?: string;
  channel_arn?: string;

  constructor(partial?: Partial<InviteSilentPushDTO>) {
    Object.assign(this, partial);
  }
}
export class InviteSilentPushDTOs {
  @ApiProperty({
    type: InviteSilentPushDTO,
    example: requestPushBody
  })
  @ValidateNested()
  @Type(() => InviteSilentPushDTO)
  @IsObject()
  @Expose()
  data: InviteSilentPushDTO;
  errors: any[];
}