import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray, IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested
} from 'class-validator';
import { CIRTERION_TYPE, SUGGESTED_OBJ_TYPE } from '../../../common/constants';
import { IsOptionalCustom } from '../../../common/decorators/class-validation.decorator';
import { RequestParam } from '../../../common/swaggers/collection.swagger';
import { IsMatchCriterionType, IsMatchCriterionValue, IsRequestByCollection } from '../decoration/suggested_collection.validation';
export class CreateSuggestedCollectionDTO {
  @IsInt()
  @Min(0)
  @ApiProperty(RequestParam.collection_id)
  @IsRequestByCollection()
  @Expose()
  collection_id: number;

  @ApiProperty(RequestParam.criterion_type)
  @IsInt()
  @IsEnum(CIRTERION_TYPE)
  @Expose()
  criterion_type: number;

  @ApiProperty(RequestParam.criterion_value)
  @Expose()
  @IsMatchCriterionValue()
  criterion_value: string | [];

  @ApiProperty(RequestParam.frequency_used)
  @IsInt()
  @Expose()
  frequency_used: number;

  @ApiProperty(RequestParam.action_time)
  @IsNumber()
  @IsOptionalCustom()
  @Expose()
  action_time: number;

  @ApiProperty(RequestParam.account_id)
  @IsInt()
  @Min(0)
  @IsOptionalCustom()
  @Expose()
  account_id: number;

  @ApiProperty(RequestParam.third_object_uid)
  @IsString()
  @Expose()
  @IsOptionalCustom()
  third_object_uid: string;

  @ApiProperty(RequestParam.third_object_type)
  @IsIn([0,1,2])
  @Expose()
  @IsOptionalCustom()
  third_object_type: number;

  @IsString()
  @IsMatchCriterionType()
  @IsEnum(SUGGESTED_OBJ_TYPE)
  @Expose()
  @ApiProperty(RequestParam.object_type)
  object_type: string;

  @IsInt()
  @Expose()
  @ApiProperty(RequestParam.group_id)
  group_id: number;

  @IsOptional()
  @IsNotEmpty()
  @ApiProperty(RequestParam.ref)
  @Expose()
  ref?: string;
}
export class CreateSuggestedCollectionSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [CreateSuggestedCollectionDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: CreateSuggestedCollectionDTO[];
  errors: CreateSuggestedCollectionDTO[];
}