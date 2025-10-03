import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray, IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber, IsOptional, IsString,
  ValidateNested
} from 'class-validator';
import { ACTION_MANUAL_RULE, CONDITION_MANUAL_RULE, MATCH_TYPE, OPERATOR_MANUAL_RULE } from '../../../common/constants/manual_rule.constant';
import { IsMatchAction, IsMatchOperator, IsOptionalCustom } from '../../../common/decorators';
import { IsTrashDto } from '../../../common/dtos/isTrash.dto';
import { RequestParam, requestBody } from '../../../common/swaggers/manual-rule.swagger';

export class ConditionsDto {
  @IsEnum(CONDITION_MANUAL_RULE)
  @IsMatchOperator()
  @Expose()
  condition: number;

  @IsNumber()
  @IsEnum(OPERATOR_MANUAL_RULE)
  @Expose()
  operator: number;

  @IsString()
  @Expose()
  value: string;
}
export class DestinationsDto {
  @IsEnum(ACTION_MANUAL_RULE)
  @IsMatchAction()
  @IsInt()
  @Expose()
  action: number;

  @IsString()
  @IsOptional()
  @Expose()
  value: string;

  @IsOptional()
  @Expose()
  collection_id: number;
}
export class CreateManualRuleDTO extends IsTrashDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty(RequestParam.name)
  @Expose()
  name: string;

  @IsNumber()
  @IsEnum(MATCH_TYPE)
  @ApiProperty(RequestParam.match_type)
  @Expose()
  match_type: number;

  @IsNumber()
  @ApiProperty(RequestParam.order_number)
  @Expose()
  order_number: number;

  @IsOptionalCustom()
  @IsIn([0,1])
  @ApiProperty(RequestParam.is_enable)
  @Expose()
  is_enable: number;

  @IsOptionalCustom()
  @IsIn([0,1])
  @ApiProperty(RequestParam.apply_all)
  @Expose()
  apply_all: number;

  @IsOptionalCustom()
  @IsNumber()
  @ApiProperty(RequestParam.account_id)
  @Expose()
  account_id: number;

  @IsArray()
  @ArrayMinSize(1)
  @ApiProperty(RequestParam.conditions)
  @ValidateNested({ each: true })
  @Type(() => ConditionsDto)
  @Expose()
  public conditions: ConditionsDto[];

  @IsArray()
  @ArrayMinSize(1)
  @ApiProperty(RequestParam.destinations)
  @ValidateNested({ each: true })
  @Type(() => DestinationsDto)
  @Expose()
  destinations: DestinationsDto[];

  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.ref)
  @Expose()
  ref?: string;
}
export class CreateManualRuleSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: CreateManualRuleDTO,
    example: [requestBody]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: CreateManualRuleDTO[];
  errors: CreateManualRuleDTO[];
}