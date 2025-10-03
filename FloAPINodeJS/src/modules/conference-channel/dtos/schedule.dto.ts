import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber, IsPositive, IsString,
  Max,
  ValidateNested
} from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';
import { RequestParam } from '../../../common/swaggers/base-get-all.swagger';

export class ScheduleDTO {
  @IsString()
  @IsOptionalCustom()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.sort)
  @Expose()
  sort: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.page_no)
  @Expose()
  page_no: number;

  @IsInt()
  @IsPositive()
  @Max(1100)
  @ApiProperty(RequestParam.page_size)
  @Expose()
  public page_size: number;

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.before_time)
  @Expose()
  public before_time: number;

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.after_time)
  @Expose()
  public after_time: number;

  @Expose()
  @IsNumber()
  @IsPositive()
  @ApiPropertyOptional(RequestParam.channel_ids)
  channel_id: number;

  @Expose()
  @IsOptionalCustom()
  @IsArray()
  @ArrayMinSize(1) // Ensure the array has at least one element
  @IsString({ each: true }) // Ensure each element is a string
  public external_meeting_id: string[];

  @IsOptionalCustom()
  @ApiProperty({ required: false, example: '6D63D672D2C-3700A1BD-EB0E-4B8E-84F9' })
  @Expose()
  ref: string;
}

export class ScheduleDTOs {
  @IsNotEmpty()
  @ApiProperty({
    type: ScheduleDTO
  })
  @ValidateNested()
  @Type(() => ScheduleDTO)
  @Expose()
  data: ScheduleDTO;
  errors: any[];
}