import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsEnum, IsInt,
  IsNotEmpty, IsNumber, IsString, Min, ValidateNested
} from 'class-validator';
import { CALL_STATUS, CALL_TYPE, IS_OWNER } from '../../../common/constants';
import { IsOptionalCustom } from '../../../common/decorators';
import { requestBody, RequestParam } from '../../../common/swaggers/call-history.swagger';
import { TRIM_STRING_TRANSFORMER } from '../../../common/transformers/trim-string.transformer';
import { AttendeeParam } from './attendee.dto';

export class CreateVideoCallDTO {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Expose()
  @ApiProperty(RequestParam.organizer)
  organizer: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Expose()
  @ApiProperty(RequestParam.invitee)
  invitee: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @Transform(TRIM_STRING_TRANSFORMER)
  @ApiProperty(RequestParam.room_url)
  room_url: string;

  @IsString()
  @IsNotEmpty()
  @Expose()
  @Transform(TRIM_STRING_TRANSFORMER)
  @ApiProperty(RequestParam.room_id)
  room_id: string;

  @IsNumber()
  @Min(0)
  @Expose()
  @ApiProperty(RequestParam.call_start_time)
  call_start_time: number;

  @IsNumber()
  @Min(0)
  @Expose()
  @ApiProperty(RequestParam.call_end_time)
  call_end_time: number;

  @IsInt()
  @IsEnum(CALL_TYPE)
  @Expose()
  @ApiProperty(RequestParam.call_type)
  call_type: number;

  @IsInt()
  @IsEnum(CALL_STATUS)
  @Expose()
  @ApiProperty(RequestParam.call_status)
  call_status: number;

  @IsInt()
  @IsEnum(IS_OWNER)
  @Expose()
  @ApiProperty(RequestParam.is_owner)
  is_owner: number;

  @IsArray()
  @ApiProperty(RequestParam.attendees)
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => AttendeeParam)
  @Expose()
  public attendees: AttendeeParam[];

  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.ref)
  @Expose()
  ref: string;
}
export class CreateVideoCallDTOSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: CreateVideoCallDTO,
    example: [requestBody]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: CreateVideoCallDTO[];
  errors: CreateVideoCallDTO[];
}