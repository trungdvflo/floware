import { HttpStatus } from '@nestjs/common';
import { ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';

export class GetApiLastModifiedDto {
  @IsString()
  @IsOptionalCustom()
  @ApiPropertyOptional({ example: 'user,setting' })
  api_name: string;
}

export class ApiLastModifiedResponse {
  @ApiResponseProperty({ example: 'setting' })
  readonly api_name: string;

  @ApiResponseProperty({ example: 1618297281.265 })
  readonly updated_date: number;
}
export class GetApiLastModifiedResponse {
  @ApiResponseProperty({ type: [ApiLastModifiedResponse] })
  data: ApiLastModifiedResponse[];
}

export class GetApiLastModifiedError {
  @ApiResponseProperty({ example: HttpStatus.BAD_REQUEST })
  code: number;

  @ApiResponseProperty({ example: {error: {message: 'APIs [invalid] are not supported'}}})
  error: {
    message: string;
  };
}
