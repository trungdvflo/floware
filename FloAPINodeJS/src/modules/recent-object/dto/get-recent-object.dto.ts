import { ApiProperty, ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsArray, IsIn, IsInt, IsNotEmpty, IsPositive, IsString, Max } from 'class-validator';
import { OBJ_TYPE } from '../../../common/constants/common';
import { IsOptionalCustom } from '../../../common/decorators';
import { RecentObjectResponse } from './recent-object.dto';

export class GetRecentObjectDto {
  @ApiProperty({
    description: 'It\'s a number integer, the number of item which want to get. In this version \
        will apply get object with pItem number. Value must be [1 - 1100]\
        Ex: page_size=50'
  })
  @Max(1100)
  @IsPositive()
  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => +value)
  page_size: number;

  @ApiPropertyOptional({
    description: 'Can be either:\
    VJOURNAL\
    VCARD'
  })
  @IsString()
  @IsOptionalCustom()
  @IsIn([OBJ_TYPE.VCARD, OBJ_TYPE.VJOURNAL])
  object_type: OBJ_TYPE.VCARD | OBJ_TYPE.VJOURNAL;

  @ApiPropertyOptional({
    description: 'It\'s a number integer, it is trash ID which you want to get items have ID > min_id.\
        Ex: &min_id=2243, it means api will get all item have ID > 2243',
    minimum: 1
  })
  @IsInt()
  @IsOptionalCustom()
  @Transform(({ value }) => +value)
  min_id: number;

  @ApiPropertyOptional({
    type: String,
    description: 'A text string, get items have ID in the list.\
        Ex: &ids=123,432,456 It means api will return the object in the list ID'
  })
  @IsOptionalCustom()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => String)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      value = value.split(',');
    }
    return value.map(v => +v);
  })
  public ids?: number[];
}

export class GetRecentObjectResponse {
  @ApiResponseProperty({type: [RecentObjectResponse]})
  data: RecentObjectResponse[];
}