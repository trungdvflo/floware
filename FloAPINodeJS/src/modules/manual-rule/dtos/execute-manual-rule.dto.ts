import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray, IsEmail, IsEnum, IsInt, IsNotEmpty,
  IsOptional,
  IsPositive, IsString, ValidateNested
} from 'class-validator';
import { ACTION_FLO_RULE } from '../../../common/constants/manual_rule.constant';
import { CheckEmailObjectUid, IsOptionalCustom } from '../../../common/decorators';
import { EmailObjectId } from '../../../common/dtos/object-uid';
import { RequestExecuteParam } from '../../../common/swaggers/manual-rule.swagger';
import { EMAIL_OBJECT_UID_TRANSFORMER } from '../../../common/transformers/object-uid.transformer';
import { TRIM_STRING_TRANSFORMER } from '../../../common/transformers/trim-string.transformer';

export class ExecuteManualRuleDTO {
  @IsInt()
  @IsEnum(ACTION_FLO_RULE)
  @ApiProperty(RequestExecuteParam.action)
  @Expose()
  action: number;

  @IsString()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestExecuteParam.value)
  @Expose()
  value: string;

  @IsInt()
  @IsPositive()
  @IsOptional()
  @ApiPropertyOptional(RequestExecuteParam.collection_id)
  @Expose()
  collection_id: number;

  @IsEmail()
  @ApiProperty(RequestExecuteParam.username)
  @Expose()
  @Transform(TRIM_STRING_TRANSFORMER)
  username: string;

  @ApiProperty(RequestExecuteParam.uid)
  @CheckEmailObjectUid()
  @Expose()
  @Transform(EMAIL_OBJECT_UID_TRANSFORMER)
  uid: EmailObjectId;

  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiPropertyOptional(RequestExecuteParam.ref)
  @Expose()
  ref?: string;
}
export class ExecuteManualRuleSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [ExecuteManualRuleDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: ExecuteManualRuleDTO[];
  errors: ExecuteManualRuleDTO[];
}