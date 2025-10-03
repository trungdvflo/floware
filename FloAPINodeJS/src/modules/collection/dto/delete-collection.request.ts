import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, ValidateNested
} from 'class-validator';
import { DeleteCollectionDTO, DeleteCollectionParam } from './collection-param';
export class DeleteCollectionBatchRequest {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({ type: DeleteCollectionParam, isArray: true })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  public data: DeleteCollectionDTO[];

  public errors: any[];
}
