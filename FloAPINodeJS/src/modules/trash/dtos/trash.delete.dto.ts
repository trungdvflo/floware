import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
    ArrayMaxSize, ArrayMinSize, IsArray,
    IsNotEmpty,
    IsNumber,
    ValidateNested
} from 'class-validator';

export class TrashDeleteDto {
  @ApiProperty({
    example: 3313
  })
  @IsNotEmpty()
  @IsNumber()
  @Expose()
  id: number;
}

export class TrashDeleteDtos {
  @ApiProperty({
    type: [TrashDeleteDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  // @Type(() => TrashDeleteDto)
  data: TrashDeleteDto[];

  errors: any[];
}