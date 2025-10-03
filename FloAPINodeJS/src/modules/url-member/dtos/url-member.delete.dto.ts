import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty,
  IsPositive,
  ValidateNested
} from 'class-validator';
import { RequestParam } from '../../../common/swaggers/url-member.swagger';

export class UrlMemberDeleteDto {
  @ApiProperty(RequestParam.id)
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Expose()
  id: number;

  @IsInt()
  @IsPositive()
  @Expose()
  @ApiProperty(RequestParam.collection_id)
  collection_id: number;
}
export class UrlMemberDeleteDtos {
  @ApiProperty({
    type: [UrlMemberDeleteDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: UrlMemberDeleteDto[];

  errors: any[];
}