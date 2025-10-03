import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested
} from 'class-validator';
import { SortObjectResponseMessage } from '../../../common/constants/message.constant';
import { SORT_OBJECT_TYPES } from '../sort-object.constant';
import { ErrorDTO } from './error.dto';
import { SortObjectDto } from './sort-object.dto';

export class UpdateSortObjectDataDtoBase {
  @ApiProperty({
    example: '0d644002-5bac-46ab-85dc-38ca49432089',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  request_uid: string;

  @ApiProperty({ type: [SortObjectDto] })
  @ArrayMaxSize(50)
  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SortObjectDto)
  objects: SortObjectDto[];
}

export class UpdateSortObjectDataDto extends UpdateSortObjectDataDtoBase {
  @ApiProperty({ example: 'VTODO', required: true })
  @IsIn(SORT_OBJECT_TYPES)
  @IsString()
  @IsNotEmpty()
  object_type: string;
}

export class UpdateSortObjectDto {
  @ApiProperty({ type: [UpdateSortObjectDataDto] })
  @IsObject()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  data: UpdateSortObjectDataDto[];
}

export class UpdateSortObjectResponseData {
  @ApiResponseProperty({ example: '0d644002-5bac-46ab-85dc-38ca49432089' })
  request_uid: string;

  @ApiResponseProperty({ example: SortObjectResponseMessage.SENT_SUCCESS })
  message: string;

  error: ErrorDTO;
}

export class UpdateSortObjectResponse {
  @ApiResponseProperty({
    example: UpdateSortObjectResponseData
  })
  data: UpdateSortObjectResponseData;
}