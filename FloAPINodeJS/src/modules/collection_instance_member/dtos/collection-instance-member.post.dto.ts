import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  ValidateNested
} from 'class-validator';
import { CollectionFavorite, CollectionIsHide } from '../../../common/constants';
import { IsHexColorCustom } from '../../../common/decorators';
import { RequestParam } from '../../../common/swaggers/collection.swagger';
import { transformColor } from '../../../common/utils/common';

export class CreateCollectionInstanceMemberDTO {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty(RequestParam.collection_id)
  @Expose()
  collection_id: number;

  @IsNotEmpty()
  @IsDefined()
  @ApiProperty()
  @IsHexColorCustom()
  @ApiProperty(RequestParam.color)
  @Transform(transformColor)
  @Expose()
  color: string;

  @IsNumber()
  @IsOptional()
  @IsEnum(CollectionFavorite)
  @ApiProperty(RequestParam.favorite)
  @Expose()
  favorite: CollectionFavorite;

  @IsOptional()
  @IsInt()
  @IsEnum(CollectionIsHide)
  @ApiPropertyOptional(RequestParam.is_hide)
  @Expose()
  is_hide: CollectionIsHide;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional(RequestParam.recent_time)
  @Expose()
  recent_time: number;

  @IsOptional()
  @IsNotEmpty()
  @ApiProperty(RequestParam.ref)
  @Expose()
  ref?: string;
}
export class CreateCollectionInstanceMemberSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [CreateCollectionInstanceMemberDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: CreateCollectionInstanceMemberDTO[];
  errors: CreateCollectionInstanceMemberDTO[];
}