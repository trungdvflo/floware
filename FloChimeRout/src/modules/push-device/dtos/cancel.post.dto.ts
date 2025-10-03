import { Expose, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

import { CALL_TYPE } from '../../../common/constants/system.constant';

export class InviteeParam {
  @IsNotEmpty()
  @IsEmail()
  @IsString()
  @Expose()
  public Email: string;
}
export class CancelPushDTO {
  @Expose()
  @IsEmail()
  Organizer: string;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => InviteeParam)
  @Expose()
  public Invitee: InviteeParam[];

  @Expose()
  @IsString()
  MeetingUrl: string;

  @Expose()
  @IsString()
  ExternalMeetingId: string;

  @Expose()
  @IsEnum(CALL_TYPE)
  CallType: number;

  constructor(partial?: Partial<CancelPushDTO>) {
    Object.assign(this, partial);
  }
}
export class SlientPushDTOs {
  @ValidateNested()
  @Type(() => CancelPushDTO)
  @Expose()
  data: CancelPushDTO;
  errors: any[];
}
