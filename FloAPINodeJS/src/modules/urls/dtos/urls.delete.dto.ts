import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty,
  IsPositive,
  ValidateNested
} from 'class-validator';

export class UrlDeleteDto {
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
}

export class UrlDeleteDtos {
  @ApiProperty({
    type: [UrlDeleteDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  // @Type(() => UrlDeleteDto)
  data: UrlDeleteDto[];

  errors: any[];
}