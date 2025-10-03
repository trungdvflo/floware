import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
    ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsEnum, IsIn, IsInt,
    IsNotEmpty, IsNumber, IsPositive, IsString, ValidateNested
} from 'class-validator';
import { CALL_TYPE, CONFERENCE_HISTORY_STATUS_IN } from '../../../common/constants';
import { IsOptionalCustom } from '../../../common/decorators';
import { RequestParam } from '../../../common/swaggers/conference-history.swagger';

export class ReplyConferenceHistoryDTO {

  @IsInt()
  @IsPositive()
  @ApiProperty(RequestParam.channel_id)
  @Expose()
  channel_id: number;

  @IsNumber()
  @IsPositive()
  @ApiProperty(RequestParam.action_time)
  @Expose()
  action_time: number;

  @IsInt()
  @IsIn([CALL_TYPE.audio_call, CALL_TYPE.video_call])
  @ApiProperty(RequestParam.type)
  @Expose()
  type: number;

  @IsInt()
  @IsEnum(CONFERENCE_HISTORY_STATUS_IN)
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

export class ReplyConferenceHistorySwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [ReplyConferenceHistoryDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: ReplyConferenceHistoryDTO[];
  errors: any[];
}