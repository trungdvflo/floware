import { Optional } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsIn } from 'class-validator';
import { IS_TRASHED_INPUT } from '../constants';
import { IsOptionalCustom } from '../decorators';

export class IsTrashDto {
  @Optional()
  @ApiPropertyOptional({
    example: 1,
  })
  @IsOptionalCustom()
  @IsIn(IS_TRASHED_INPUT)
  @Expose()
  is_trashed?: number;
}