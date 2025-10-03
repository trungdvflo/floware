import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsIn,
  IsInt,
  IsNotEmpty, IsString, Min, ValidateIf,
  ValidateNested
} from 'class-validator';
import {
  ACTION,
  DESTINATION_OBJECT_TYPE, SOURCE_OBJECT_TYPE
} from '../../../common/constants/common';
import { CheckObjectHref, IsOptionalCustom } from '../../../common/decorators';
import { IsTrashDto } from '../../../common/dtos/isTrash.dto';
import { requestBody, RequestParam } from '../../../common/swaggers/history.swagger';
import { TRIM_STRING_TRANSFORMER } from '../../../common/transformers/trim-string.transformer';

export class CreateHistoryActionOneDTO {
  @IsInt()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.source_account_id)
  @Expose()
  source_account_id: number;

  @IsInt()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.destination_account_id)
  @Expose()
  destination_account_id: number;
}

export class CreateHistoryBaseDTO extends IsTrashDto {
  @IsIn(ACTION)
  @IsNotEmpty()
  @ApiProperty(RequestParam.action)
  @Transform(({ value }) => +value)
  @Expose()
  action: number;
}

export class CreateHistoryCaseFloContactDTO extends CreateHistoryBaseDTO {
  @IsNotEmpty()
  @IsDefined()
  @ApiProperty(RequestParam.destination_object_uid)
  @Expose()
  destination_object_uid: any;

  @ApiProperty(RequestParam.source_object_type)
  @IsNotEmpty()
  @IsIn(SOURCE_OBJECT_TYPE)
  @Expose()
  source_object_type: string;

  @ApiProperty(RequestParam.destination_object_type)
  @IsDefined()
  @IsString()
  @IsIn(DESTINATION_OBJECT_TYPE)
  @Expose()
  destination_object_type: string;

  @IsString()
  @ApiProperty(RequestParam.source_object_uid)
  @IsNotEmpty()
  @Expose()
  source_object_uid: string;

  @IsInt()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.source_account_id)
  @Expose()
  source_account_id: number;

  @IsInt()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.destination_account_id)
  @Expose()
  destination_account_id: number;

  @Transform(TRIM_STRING_TRANSFORMER)
  @CheckObjectHref('source_object_type')
  @ApiProperty(RequestParam.source_object_href)
  @Expose()
  source_object_href: string;

  @Transform(TRIM_STRING_TRANSFORMER)
  @CheckObjectHref('destination_object_type')
  @ApiProperty(RequestParam.destination_object_href)
  @Expose()
  destination_object_href: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.action_data)
  @Expose()
  action_data: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.path)
  @Expose()
  path: string;

  @IsOptionalCustom()
  @ApiProperty(RequestParam.ref)
  @Expose()
  ref: string | number;
}

export class CreateHistoryCaseSRMailDTO extends CreateHistoryBaseDTO {
  @IsNotEmpty()
  @IsDefined()
  @ApiProperty(RequestParam.destination_object_uid)
  @Expose()
  destination_object_uid: any;

  @ApiProperty(RequestParam.source_object_type)
  @IsNotEmpty()
  @IsIn(SOURCE_OBJECT_TYPE)
  @Expose()
  source_object_type: string;

  @ApiProperty(RequestParam.destination_object_type)
  @IsNotEmpty()
  @IsString()
  @IsIn(DESTINATION_OBJECT_TYPE)
  @Expose()
  destination_object_type: string;

  @IsString()
  @ApiProperty(RequestParam.source_object_uid)
  @IsNotEmpty()
  @Expose()
  source_object_uid: string;

  @IsInt()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.source_account_id)
  @Expose()
  source_account_id: number;

  @IsInt()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.destination_account_id)
  @Expose()
  destination_account_id: number;

  @Transform(TRIM_STRING_TRANSFORMER)
  @CheckObjectHref('source_object_type')
  @ApiProperty(RequestParam.source_object_href)
  @Expose()
  source_object_href: string;

  @Transform(TRIM_STRING_TRANSFORMER)
  @CheckObjectHref('destination_object_type')
  @ApiProperty(RequestParam.destination_object_href)
  @Expose()
  destination_object_href: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.action_data)
  @Expose()
  action_data: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.path)
  @Expose()
  path: string;

  @IsOptionalCustom()
  @ApiProperty(RequestParam.ref)
  @Expose()
  ref: string | number;
}

export class CreateHistoryCaseSkypeDTO extends CreateHistoryBaseDTO {
  @IsInt()
  @Transform(({ value }) => {
    return value ? +value : 0;
  })
  @ApiProperty(RequestParam.source_account_id)
  @Expose()
  source_account_id: number;

  @IsString()
  @ApiProperty(RequestParam.source_object_uid)
  @IsNotEmpty()
  @Expose()
  source_object_uid: string;

  @ApiProperty(RequestParam.source_object_type)
  @IsNotEmpty()
  @IsIn(SOURCE_OBJECT_TYPE)
  @Expose()
  source_object_type: string;

  @IsInt()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.destination_account_id)
  @Expose()
  destination_account_id: number;

  @IsNotEmpty()
  @IsDefined()
  @ApiProperty(RequestParam.destination_object_uid)
  @Expose()
  destination_object_uid: any;

  @ApiProperty(RequestParam.destination_object_type)
  @IsString()
  @ValidateIf(o => !(o.destination_object_type?.length === 0))
  @IsIn(DESTINATION_OBJECT_TYPE)
  @Expose()
  destination_object_type: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.action_data)
  @Expose()
  action_data: string;

  @Transform(TRIM_STRING_TRANSFORMER)
  @CheckObjectHref('destination_object_type')
  @ApiProperty(RequestParam.destination_object_href)
  @Expose()
  destination_object_href: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.path)
  @Expose()
  path: string;
}

export class CreateHistoryCase3rdPartyDTO extends CreateHistoryBaseDTO {
  @IsInt()
  @Transform(({ value }) => {
    return value ? +value : 0;
  })
  @ApiProperty(RequestParam.source_account_id)
  @Expose()
  source_account_id: number;

  @IsString()
  @ApiProperty(RequestParam.source_object_uid)
  @IsNotEmpty()
  @Expose()
  source_object_uid: string;

  @ApiProperty(RequestParam.source_object_type)
  @IsNotEmpty()
  @IsIn(SOURCE_OBJECT_TYPE)
  @Expose()
  source_object_type: string;

  @IsInt()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.destination_account_id)
  @Expose()
  destination_account_id: number;

  @IsNotEmpty()
  @IsDefined()
  @ApiProperty(RequestParam.destination_object_uid)
  @Expose()
  destination_object_uid: any;

  @ApiProperty(RequestParam.destination_object_type)
  @IsNotEmpty()
  @IsString()
  @IsIn(DESTINATION_OBJECT_TYPE)
  @Expose()
  destination_object_type: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.action_data)
  @Expose()
  action_data: string;

  @Transform(TRIM_STRING_TRANSFORMER)
  @CheckObjectHref('destination_object_type')
  @ApiProperty(RequestParam.destination_object_href)
  @Expose()
  destination_object_href: string;

  @IsString()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.path)
  @Expose()
  path: string;
}

export class CreateHistoryCasePhoneCallDTO {
  @IsInt()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.source_account_id)
  @Expose()
  source_account_id: number;

  @IsString()
  @ApiProperty(RequestParam.source_object_uid)
  @IsNotEmpty()
  @Expose()
  source_object_uid: string;

  @ApiProperty(RequestParam.source_object_type)
  @IsNotEmpty()
  @IsIn(SOURCE_OBJECT_TYPE)
  @Expose()
  source_object_type: string;

  @Transform(TRIM_STRING_TRANSFORMER)
  @CheckObjectHref('source_object_type')
  @ApiProperty(RequestParam.source_object_href)
  @Expose()
  source_object_href: string;

  @IsInt()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.destination_account_id)
  @Expose()
  destination_account_id: number;

  @IsNotEmpty()
  @IsDefined()
  @ApiProperty(RequestParam.destination_object_uid)
  @Expose()
  destination_object_uid: any;

  @ApiProperty(RequestParam.destination_object_type)
  @IsString()
  @ValidateIf(o => !(o.destination_object_type?.length === 0))
  @IsIn(DESTINATION_OBJECT_TYPE)
  @Expose()
  destination_object_type: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.action_data)
  @Expose()
  action_data: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.path)
  @Expose()
  path: string;
}

// @ts-ignore
export class CreateHistoryDTO extends CreateHistoryBaseDTO {
  @IsNotEmpty()
  @IsDefined()
  @ApiProperty(RequestParam.destination_object_uid)
  @Expose()
  destination_object_uid: any;

  @ApiProperty(RequestParam.source_object_type)
  @IsNotEmpty()
  @IsIn(SOURCE_OBJECT_TYPE)
  @Expose()
  @Transform(TRIM_STRING_TRANSFORMER)
  source_object_type: string;

  @ApiProperty(RequestParam.destination_object_type)
  @IsString()
  @IsDefined()
  @IsIn(DESTINATION_OBJECT_TYPE)
  @Expose()
  destination_object_type: string;

  @IsString()
  @ApiProperty(RequestParam.source_object_uid)
  @IsNotEmpty()
  @Expose()
  source_object_uid: string;

  @IsInt()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.source_account_id)
  @Expose()
  @Min(0)
  source_account_id: number;

  @IsInt()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.destination_account_id)
  @Expose()
  @Min(0)
  destination_account_id: number;

  @Transform(TRIM_STRING_TRANSFORMER)
  @CheckObjectHref('source_object_type')
  @ApiProperty(RequestParam.source_object_href)
  @Expose()
  source_object_href: string;

  @Transform(TRIM_STRING_TRANSFORMER)
  @CheckObjectHref('destination_object_type')
  @ApiProperty(RequestParam.destination_object_href)
  @Expose()
  destination_object_href: string;

  @IsString()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.action_data)
  @Expose()
  action_data: string;

  @IsString()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.path)
  @Expose()
  path: string;

  @IsOptionalCustom()
  @ApiProperty(RequestParam.ref)
  @Expose()
  ref: string | number;
}

export class CreateHistorySwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: CreateHistoryDTO,
    example: [requestBody]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: CreateHistoryDTO[];
  errors: CreateHistoryDTO[];
}

export class CreateHistoryActionDTO {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: CreateHistoryBaseDTO[];
}