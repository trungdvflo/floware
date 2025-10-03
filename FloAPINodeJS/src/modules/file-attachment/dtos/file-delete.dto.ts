import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
    ArrayMaxSize, ArrayMinSize, IsArray,
    IsIn, IsInt, IsNotEmpty, IsString, ValidateNested
} from 'class-validator';
import { FILE_MOD } from "../../../common/constants";
export class DeleteFileDTO {
  @IsString()
  @ApiProperty({required: true})
  @Expose()
  id: string;

  @IsInt()
  @IsIn(FILE_MOD)
  @ApiProperty({required:true})
  @Expose()
  mod: number;
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