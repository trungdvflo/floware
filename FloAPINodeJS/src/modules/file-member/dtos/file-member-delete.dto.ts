import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsNumber, IsString, ValidateNested
} from 'class-validator';
import { RequestParam } from '../../../common/swaggers/file-member.swagger';
export class DeleteFileDTO {
  @IsString()
  @ApiProperty(RequestParam.uid)
  @Expose()
  uid: string;

  @IsNumber()
  @ApiProperty({ required: true, example:RequestParam.collection_id.example})
  @Expose()
  collection_id: number;
}
export class DeleteFileSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: DeleteFileDTO,
    example: [
      {
        uid: '0441e3c7-6469-4a9a-b1fc-637e8c881fa3',
        collection_id: 1
      },
      {
        uid: '0441e3c7-6469-4a9a-b1fc-637e8c881fa3',
        collection_id: 1
      },
    ]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: DeleteFileDTO[];
  errors: DeleteFileDTO[];
}