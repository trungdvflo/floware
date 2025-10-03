import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsNumber, ValidateNested
} from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';
import { RequestParam } from '../../../common/swaggers/collection.swagger';

export class UpdateSuggestedCollectionDTO {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;

  @ApiProperty(RequestParam.action_time)
  @IsNumber()
  @IsOptionalCustom()
  @Expose()
  action_time: number;

  @ApiProperty(RequestParam.frequency_used)
  @IsInt()
  @IsOptionalCustom()
  @Expose()
  frequency_used: number;
}

export class UpdateSuggestedCollectionSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [UpdateSuggestedCollectionDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: UpdateSuggestedCollectionDTO[];
  errors: UpdateSuggestedCollectionDTO[];
}