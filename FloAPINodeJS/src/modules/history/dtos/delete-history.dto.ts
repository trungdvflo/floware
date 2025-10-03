import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
    ArrayMaxSize, ArrayMinSize, IsArray,
    IsInt, IsNotEmpty, ValidateNested
} from 'class-validator';
export class DeleteHistoryDTO {
  @IsInt()
  @ApiProperty()
  @Expose()
  id: number;
}

export class DeleteHistorySwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: DeleteHistoryDTO,
    example: [
      {
        'id': 10
      },
      {
        'id': 11
      },
    ]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: DeleteHistoryDTO[];
  errors: DeleteHistoryDTO[];
}