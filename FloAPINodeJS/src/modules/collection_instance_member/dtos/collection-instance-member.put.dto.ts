import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
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

export class UpdateCollectionInstanceMemberDTO {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;

  @IsOptional()
  @ApiProperty()
  @IsHexColorCustom()
  @ApiProperty(RequestParam.color)
  @Transform(transformColor)
  @Expose()
  color: string;

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

  @IsNumber()
  @IsOptional()
  @IsEnum(CollectionFavorite)
  @ApiProperty(RequestParam.favorite)
  @Expose()
  favorite: CollectionFavorite;
}
export class UpdateCollectionInstanceMemberSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [UpdateCollectionInstanceMemberDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: UpdateCollectionInstanceMemberDTO[];
  errors: UpdateCollectionInstanceMemberDTO[];
}