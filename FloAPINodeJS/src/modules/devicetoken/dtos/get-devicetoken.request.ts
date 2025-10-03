import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber, IsString,
  Max,
  Min
} from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';
import { Devicetoken } from '../../../common/entities/devicetoken.entity';

export class GetDevicetokenDTO {
  @ApiProperty({
    example: 50,
    description: 'It\'s a number integer, the number of item which want to get. In this version \
    will apply get object with page_size number. Value must be [1 - 1100]'
  })
  @IsInt()
  @Min(1)
  @Max(1100)
  @Transform(({ value }) => Number(value))
  public page_size: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({
    example: 1247872251.212,
    description: 'It\'s a number float, get items have updated_date greater than equal the time.'
  })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  public modified_gte?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({
    example: 1617874851.301,
    description: 'It\'s a number float, get item have updated_date Less Than the time.'
  })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  public modified_lt?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({
    example: 1,
    description: 'It\'s a number integer, it is trash ID which you want to get items have ID > min_id'
  })
  @IsInt()
  @Transform(({ value }) => Number(value))
  public min_id?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({
    type: String,
    description: 'A text string, get items with some fields which you want to show.\
    You can follow the table above'
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.split(',').map(v => v.trim()))
  public fields?: (keyof Devicetoken)[];
}
