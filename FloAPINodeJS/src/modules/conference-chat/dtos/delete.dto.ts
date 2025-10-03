import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray,
  IsInt,
  IsNotEmpty,
  ValidateNested
} from 'class-validator';

export class DeleteFileDTO {
  @Expose()
  @ApiProperty({
    description: "uid file of item which want to download"
  })
  @IsInt()
  @IsNotEmpty()
  id: number;
}
export class DeleteFileSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: DeleteFileDTO,
    example: [
      {
        uid: '0441e3c7-6469-4a9a-b1fc-637e8c881fa3',
      },
      {
        uid: '0441e3c7-6469-4a9a-b1fc-637e8c881fa3',
      }
    ]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: DeleteFileDTO[];
  errors: DeleteFileDTO[];
}