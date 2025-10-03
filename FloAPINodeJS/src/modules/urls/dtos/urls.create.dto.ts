import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty,
  IsNumber, IsPositive, IsString,
  IsUrl, ValidateNested
} from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';
import { IsTrashDto } from '../../../common/dtos/isTrash.dto';
import { TRIM_STRING_TRANSFORMER } from '../../../common/transformers/trim-string.transformer';

// @ApiExtraModels()
export class UrlsCreateDto extends IsTrashDto {
  @ApiProperty({
    example: 'http://example.com'
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  @Expose()
  url: string;

  @ApiPropertyOptional({
    example: 'example title'
  })
  @IsString()
  @IsOptionalCustom()
  @Transform(TRIM_STRING_TRANSFORMER)
  @Expose()
  title: string;

  @ApiPropertyOptional({
    example: 123456.123
  })
  @IsOptionalCustom()
  @IsNumber()
  @IsPositive()
  @Expose()
  recent_date: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptionalCustom()
  @Expose()
  ref: string;
}

export class UrlsCreateDtos {
  @ApiProperty({
    type: [UrlsCreateDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  // @Type(() => UrlsCreateDto)
  data: UrlsCreateDto[];

  public errors: any[];
}

export class UrlCreateError {

}