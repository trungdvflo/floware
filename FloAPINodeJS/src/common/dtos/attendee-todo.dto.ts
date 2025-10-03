import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsArray, IsBoolean, IsEmail, IsEnum, IsString
} from 'class-validator';
import { CheckStatCode, IsOptionalCustom } from '../decorators';
export enum CUTYPE{
  'INDIVIDUAL' = 'INDIVIDUAL',// default
  'GROUP' = 'GROUP',
  'RESOURCE' = 'RESOURCE',
  'ROOM' = 'ROOM',
  'UNKNOWN' = 'UNKNOWN',
}
export enum ROLE{
  'CHAIR' = 'CHAIR',
  'REQ_PARTICIPANT' = 'REQ-PARTICIPANT',// default
  'OPT_PARTICIPANT' = 'OPT-PARTICIPANT',
  'NON_PARTICIPANT' = 'NON-PARTICIPANT',
}
export enum PARTSTAT{
  'NEEDS_ACTION' = 'NEEDS-ACTION',// default
  'ACCEPTED' = 'ACCEPTED',
  'DECLINED' = 'DECLINED',
  'TENTATIVE' = 'TENTATIVE',
  'DELEGATED' = 'DELEGATED',
}

export class AttendeeParam {
  @IsOptionalCustom()
  @IsString()
  @Expose()
  @Transform(({ value }) => String(value).trim())
  @ApiPropertyOptional({ example: "John Smith" })
  public cn : string;

  // https://www.kanzaki.com/docs/ical/cutype.html
  @IsOptionalCustom()
  @Expose()
  @IsEnum(CUTYPE, {message:`cutype must be one of the following values in [${Object.values(CUTYPE).join(', ')}]`})
  @ApiPropertyOptional({ example: CUTYPE.INDIVIDUAL })
  public cutype: CUTYPE;

  // https://www.kanzaki.com/docs/ical/role.html
  @IsOptionalCustom()
  @Expose()
  @IsEnum(ROLE, {message:`role must be one of the following values in [${Object.values(ROLE).join(', ')}]`})
  @ApiPropertyOptional({ example: ROLE.REQ_PARTICIPANT })
  public role : ROLE;

  @IsOptionalCustom()
  @IsBoolean()
  @Expose()
  @ApiPropertyOptional({ example: false })
  public rsvp : boolean;

  // https://www.kanzaki.com/docs/ical/partstat.html
  @IsOptionalCustom()
  @Expose()
  @IsEnum(PARTSTAT,{message:`partstat must be one of the following values in [${Object.values(PARTSTAT).join(', ')}]`})
  @ApiPropertyOptional({ example: PARTSTAT.NEEDS_ACTION })
  public partstat: PARTSTAT;

  @IsOptionalCustom()
  @IsEmail()
  @Expose()
  @Transform(({ value }) => String(value).trim())
  @ApiPropertyOptional({ example: "jsmith@host.com"})
  public email: string;

  // 2.xx - 4.xx
  @IsOptionalCustom()
  @IsArray()
  @Expose()
  @CheckStatCode('schedule_status')
  @ApiPropertyOptional({ example: [2.1,3.2]})
  public schedule_status: number[];
}
