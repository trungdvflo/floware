import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsEnum, IsIn, IsInt,
  IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Matches, ValidateNested
} from 'class-validator';
import { CALL_TYPE, CONFERENCE_HISTORY_STATUS } from '../../../common/constants';
import { IsOptionalCustom } from '../../../common/decorators';
import { RequestParam } from '../../../common/swaggers/conference-history.swagger';
import { PHONE_REGEX } from '../../conference-channel/dtos';
import { InviteeParam } from '../../conference-invite/dtos';

export class CreateConferenceHistoryDTO {

  @Expose()
  @IsString()
  @ApiProperty(RequestParam.phone_number)
  @Matches(PHONE_REGEX)
  @IsOptional()
  phone_number?: string;

  @IsArray()
  @IsOptional()
  @ApiProperty(RequestParam.invitee)
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => InviteeParam)
  @Expose()
  public attendees: InviteeParam[];

  @IsInt()
  @IsPositive()
  @ApiProperty(RequestParam.channel_id)
  @Expose()
  channel_id: number;

  @IsNumber()
  @IsPositive()
  @ApiProperty(RequestParam.start_time)
  @Expose()
  start_time: number;

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.end_time)
  @Expose()
  end_time: number;

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.action_time)
  @Expose()
  action_time: number;

  @IsInt()
  @IsIn([CALL_TYPE.audio_call, CALL_TYPE.video_call])
  @ApiProperty(RequestParam.type)
  @Expose()
  type: number;

  @IsInt()
  @IsEnum(CONFERENCE_HISTORY_STATUS)
  @ApiProperty(RequestParam.status)
  @Expose()
  status: number;

  @IsEmail()
  @ApiProperty(RequestParam.organizer)
  @Expose()
  organizer: string;

  @IsString()
  @ApiProperty(RequestParam.meeting_id)
  @Expose()
  meeting_id: string;

  @IsString()
  @IsOptionalCustom()
  @ApiPropertyOptional()
  @Expose()
  external_meeting_id: string;

  @IsOptionalCustom()
  @IsString()
  @ApiProperty(RequestParam.ref)
  @Expose()
  ref?: string;
}

export class CreateConferenceHistorySwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [CreateConferenceHistoryDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: CreateConferenceHistoryDTO[];
  errors: any[];
}