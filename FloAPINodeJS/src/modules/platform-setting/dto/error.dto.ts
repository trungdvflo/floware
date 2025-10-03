import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsInt, IsString } from 'class-validator';
export class ErrorDTO {

  @ApiProperty()
  @IsInt()
  @Expose()
  code: number;

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