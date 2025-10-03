import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ArrayMinSize, IsArray, IsEmail,
  IsEnum, IsInt,
  IsObject,
  IsOptional, IsPositive, IsString, ValidateNested
} from "class-validator";
import { CALL_TYPE, REPLY_SEND_STATUS } from '../../../common/constants';
import { IsOptionalCustom } from '../../../common/decorators';
import { RequestPushParam, requestPushBody } from '../../../common/swaggers/device-token.swagger';
import { InviteeParam } from './invite.silent-push.dto';

export class ReplySilentPushDTO {
  @Expose()
  @IsEmail()
  @ApiProperty(RequestPushParam.organizer)
  organizer: string;

  @IsArray()
  @ApiProperty(RequestPushParam.invitee)
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => InviteeParam)
  @Expose()
  public invitee: InviteeParam[];

  @Expose()
  @IsString()
  @ApiProperty(RequestPushParam.meeting_url)
  meeting_url: string;

  @Expose()
  @IsString()
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
  @IsEnum(REPLY_SEND_STATUS)
  @ApiProperty(RequestPushParam.invite_status)
  reply_status: number;

  @Expose()
  @IsEnum(CALL_TYPE)
  @ApiProperty(RequestPushParam.call_type)
  call_type: number;

  @IsString()
  @IsOptionalCustom()
  @ApiPropertyOptional()
  @Expose()
  external_meeting_id?: string;

  constructor(partial?: Partial<ReplySilentPushDTO>) {
    Object.assign(this, partial);
  }
}
export class ReplySilentPushDTOs {
  @ApiProperty({
    type: ReplySilentPushDTO,
    example: requestPushBody
  })
  @ValidateNested()
  @Type(() => ReplySilentPushDTO)
  @IsObject()
  @Expose()
  data: ReplySilentPushDTO;
  errors: any[];
}