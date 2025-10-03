import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsInt,
  IsNotEmpty, IsNumber, IsPositive, ValidateNested
} from 'class-validator';
import { CONFERENCE_HISTORY_STATUS } from '../../../common/constants';
import { IsOptionalCustom } from '../../../common/decorators';
import { RequestParam } from '../../../common/swaggers/conference-history.swagger';

export class UpdateConferenceHistoryDTO {

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.start_time)
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
  @IsEnum(CONFERENCE_HISTORY_STATUS)
  @ApiProperty(RequestParam.status)
  @Expose()
  status: number;
}

export class UpdateConferenceHistorySwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [UpdateConferenceHistoryDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: UpdateConferenceHistoryDTO[];
  errors: any[];
}