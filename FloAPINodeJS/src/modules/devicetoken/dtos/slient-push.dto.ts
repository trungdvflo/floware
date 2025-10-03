import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsEmail, IsEnum, IsNotEmpty, IsString, ValidateNested } from "class-validator";
import { CALL_TYPE, SEND_STATUS } from '../../../common/constants';
import { RequestPushParam, requestPushBody } from '../../../common/swaggers/device-token.swagger';

export class InviteeParam {
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  @ApiProperty({ example: 'khoapm@flouat.net' })
  @Expose()
  public email: string;
}
export class SilentPushDTO {
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
  @ApiProperty(RequestPushParam.room_url)
  room_url?: string;

  @Expose()
  @IsString()
  @ApiProperty(RequestPushParam.room_id)
  room_id?: string;

  @Expose()
  @IsEnum(SEND_STATUS)
  @ApiProperty(RequestPushParam.invite_status)
  invite_status: number;

  @Expose()
  @IsEnum(CALL_TYPE)
  @ApiProperty(RequestPushParam.call_type)
  call_type: number;

  constructor(partial?: Partial<SilentPushDTO>) {
    Object.assign(this, partial);
  }
}
export class SilentPushDTOs {
  @ApiProperty({
    type: SilentPushDTO,
    example: requestPushBody
  })
  @ValidateNested()
  @Type(() => SilentPushDTO)
  @Expose()
  data: SilentPushDTO;
  errors: any[];
}