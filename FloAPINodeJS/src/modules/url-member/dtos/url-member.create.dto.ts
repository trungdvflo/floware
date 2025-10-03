import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty,
  IsNumber,
  IsOptional, IsPositive, IsString,
  IsUrl, ValidateNested
} from 'class-validator';
import { IsTrashDto } from '../../../common/dtos/isTrash.dto';
import { requestBodyCreate, RequestParam } from '../../../common/swaggers/url-member.swagger';
import { TRIM_STRING_TRANSFORMER } from '../../../common/transformers/trim-string.transformer';

// @ApiExtraModels()
export class UrlMembersCreateDto extends IsTrashDto {
  @IsInt()
  @IsPositive()
  @Expose()
  @ApiProperty(RequestParam.collection_id)
  collection_id: number;

  @ApiProperty(RequestParam.url)
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  @Expose()
  url: string;

  @ApiPropertyOptional(RequestParam.title)
  @IsString()
  @IsOptional()
  @Transform(TRIM_STRING_TRANSFORMER)
  @Expose()
  title: string;

  @ApiPropertyOptional(RequestParam.recent_date)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  @Expose()
  recent_date: number;

  @ApiPropertyOptional(RequestParam.ref)
  @IsString()
  @IsOptional()
  @Expose()
  ref: string;
}

export class UrlMembersCreateDtos {
  @ApiProperty({
    type: [UrlMembersCreateDto],
    example: [requestBodyCreate]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  // @Type(() => UrlsCreateDto)
  data: UrlMembersCreateDto[];

  public errors: any[];
}

export class UrlMemberCreateError {

}