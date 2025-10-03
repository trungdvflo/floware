import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray,
  IsInt, IsNotEmpty,
  IsNumber, IsPositive, IsString,
  IsUrl,
  ValidateNested
} from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';
import { IsTrashDto } from '../../../common/dtos/isTrash.dto';
import { TRIM_STRING_TRANSFORMER } from '../../../common/transformers/trim-string.transformer';

// @ApiExtraModels()
export class UrlsUpdateDto extends IsTrashDto {
  @ApiProperty({
    example: 123456
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Expose()
  id: number;

  // @ApiProperty({
  //   example: "3b0ea370-a40c-11eb-9b52-cfb7a3ad9eee7"
  // })
  // @IsNotEmpty()
  // @IsUUID()
  // @Expose()
  // uid: string;

  @ApiProperty({
    example: 'http://example.com'
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  @Expose()
  url: string;

  @ApiPropertyOptional()
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
}

export class UrlsUpdateDtos {
  @ApiProperty({
    type: [UrlsUpdateDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  // @Type(() => UrlsUpdateDto)
  data: UrlsUpdateDto[];

  public errors: any[];
}