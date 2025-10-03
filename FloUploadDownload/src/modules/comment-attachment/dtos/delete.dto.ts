import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
    ArrayMaxSize, ArrayMinSize, IsArray,
    IsNotEmpty, IsString, ValidateNested
} from 'class-validator';

export class DeleteFileDTO {
  @Expose()
  @ApiProperty({
    description: "uid file of item which want to download"
  })
  @IsString()
  @IsNotEmpty()
  uid: string;
}
export class DeleteFileSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: DeleteFileDTO,
    example: [
      {
        id: '0441e3c7-6469-4a9a-b1fc-637e8c881fa3',
        mod: 0
      },
      {
        id: '0441e3c7-6469-4a9a-b1fc-637e8c881fa3',
        mod: 1
      }
    ]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: DeleteFileDTO[];
  errors: DeleteFileDTO[];
}