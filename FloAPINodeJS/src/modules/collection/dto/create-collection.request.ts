import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, ValidateNested
} from 'class-validator';
import { CreateCollectionParam } from './collection-param';
import { CollectionParamError } from './collection-param-error';
export class CreateCollectionBatchRequest {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({ type: CreateCollectionParam, isArray: true })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  public data: CreateCollectionParam[];

  public errors: CollectionParamError[];
}
