import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty,
  IsPositive,
  ValidateNested
} from 'class-validator';

export class RecentObjectDeleteDto {
  @ApiProperty({
    example: 123456
  })
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @Expose()
  id: number;
}

export class RecentObjectDeleteDtos {
  @ApiProperty({
    type: [RecentObjectDeleteDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: RecentObjectDeleteDto[];

  errors: any[];
}