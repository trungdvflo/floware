import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsDefined,
  IsNotEmpty, IsString,
  IsUUID
} from 'class-validator';
import { IsOptionalCustom, IsType } from '../decorators';

export class MoveCalendarObjectDTO {
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @ApiProperty({ example: "0a54bb20-a40c-11eb-bc69-bb27e9fcb7a3" })
  @Expose()
  public calendar_uri: string;

  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @IsUUID()
  @ApiProperty({ example: "6894ae48-927b-4e23-ae76-30697808d740" })
  @Expose()
  public uid: string;

  @IsOptionalCustom()
  @ApiPropertyOptional({ example: '6D63D672D2C-3700A1BD-EB0E-4B8E-84F9' })
  @IsType(['string', 'number'])
  @Expose()
  public ref?: string | number;
}
