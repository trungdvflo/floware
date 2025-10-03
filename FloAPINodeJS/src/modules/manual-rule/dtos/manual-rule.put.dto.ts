import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray,
  IsEnum, IsIn, IsNotEmpty, IsNumber, IsString, ValidateNested
} from 'class-validator';
import { MATCH_TYPE } from '../../../common/constants/manual_rule.constant';
import { IsOptionalCustom } from '../../../common/decorators';
import { IsTrashDto } from '../../../common/dtos/isTrash.dto';
import { RequestParam, requestBodyUpdateManualRule } from '../../../common/swaggers/manual-rule.swagger';
import { ConditionsDto, DestinationsDto } from './manual-rule.post.dto';

export class UpdateManualRuleDTO extends IsTrashDto {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;

  @IsOptionalCustom()
  @IsString()
  @IsNotEmpty()
  @ApiProperty(RequestParam.name)
  @Expose()
  name: string;

  @IsOptionalCustom()
  @IsNumber()
  @IsEnum(MATCH_TYPE)
  @ApiProperty(RequestParam.match_type)
  @Expose()
  match_type: number;

  @IsOptionalCustom()
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
  @IsNumber()
  @ApiProperty(RequestParam.account_id)
  @Expose()
  account_id: number;

  @IsOptionalCustom()
  @IsIn([0,1])
  @ApiProperty(RequestParam.is_enable)
  @Expose()
  apply_all: number;

  @IsOptionalCustom()
  @IsArray()
  @ApiProperty(RequestParam.conditions)
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ConditionsDto)
  @Expose()
  public conditions: ConditionsDto[];

  @IsOptionalCustom()
  @IsArray()
  @ApiProperty(RequestParam.destinations)
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DestinationsDto)
  @Expose()
  destinations: DestinationsDto[];
}

export class UpdateManualRuleSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: UpdateManualRuleDTO,
    example: [requestBodyUpdateManualRule]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: UpdateManualRuleDTO[];
  errors: UpdateManualRuleDTO[];
}