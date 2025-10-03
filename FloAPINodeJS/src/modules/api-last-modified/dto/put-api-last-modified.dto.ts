import { HttpStatus } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsDefined,
  IsIn, IsNumber, IsPositive,
  IsString, ValidateNested
} from 'class-validator';
import { ApiLastModifiedName } from '../../../common/constants';
import { ApiLastModifiedResponse } from './get-api-last-modified.dto';

export class PutApiLastModifiedDto {
  @IsDefined()
  @IsString()
  @ApiPropertyOptional({ example: 'user' })
  @IsIn(Object.values(ApiLastModifiedName))
  @Expose()
  api_name: ApiLastModifiedName;

  @ApiPropertyOptional({ example: 1618297281.265 })
  @IsNumber()
  @IsPositive()
  @Expose()
  updated_date: number;
}
export class PutApiLastModifiedDtos {
  @ApiProperty({
    type: [PutApiLastModifiedDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: PutApiLastModifiedDto[];
  errors: any[];
}
export class PutApiLastModifiedResponse {
  @ApiResponseProperty({ type: [ApiLastModifiedResponse] })
  data: ApiLastModifiedResponse[];
}

export class PutApiLastModifiedError {
  @ApiResponseProperty({ example: HttpStatus.BAD_REQUEST })
  code: number;

  @ApiResponseProperty({ example: { error: { message: 'APIs [invalid] are not supported' } } })
  error: {
    message: string;
  };
}