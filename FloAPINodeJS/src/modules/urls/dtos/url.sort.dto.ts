import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,

  IsNotEmpty, ValidateNested
} from 'class-validator';
import { SortObjectResponseMessage } from '../../../common/constants/message.constant';
import { ErrorDTO } from '../../../common/dtos/error.dto';
import { SortObjectDto } from '../../../modules/sort-object/dto/sort-object.dto';

export class UrlSortObjectDto {
  @ApiProperty({ type: [SortObjectDto] })
  @IsArray()
  @ArrayMaxSize(50)
  @ArrayMinSize(1)
  @IsNotEmpty()
  @Type(() => SortObjectDto)
  @ValidateNested({ each: true })
  data: SortObjectDto[];
}

export class UrlSortObjectResponseData {
  @ApiResponseProperty({ example: '0d644002-5bac-46ab-85dc-38ca49432089' })
  request_uid: string;

  @ApiResponseProperty({ example: SortObjectResponseMessage.SENT_SUCCESS })
  message: string;

  error: ErrorDTO;
}

export class UrlSortObjectResponse {
  @ApiResponseProperty({
    example: UrlSortObjectResponseData
  })
  data: UrlSortObjectResponseData;
}