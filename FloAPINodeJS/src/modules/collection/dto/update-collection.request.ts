import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
    ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, ValidateNested
} from 'class-validator';
import { UpdateCollectionParam } from './collection-param';
export class UpdateCollectionBatchRequest {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({ type: UpdateCollectionParam, isArray: true })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  public data: UpdateCollectionParam[];

  public errors: any[];
}
