import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNumber, IsPositive, IsString } from 'class-validator';

export class ErrorDTO {
  @ApiProperty()
  @IsNumber()
  @IsPositive()
  @Expose()
  statusCode?: number | null;

  @ApiProperty()
  @IsString()
  @Expose()
  code: string;

  @ApiProperty()
  @IsString()
  @Expose()
  message: string;

  @ApiProperty()
  @Expose()
  attributes: any;

  @ApiProperty()
  @Expose()
  errors: any[];

  constructor(partial?: Partial<ErrorDTO>) {
    Object.assign(this, partial);
  }
}