import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty } from 'class-validator';
import { LinkedCollectionRequestParamError } from './error.dto';
import {
  LinkedCollectionObjectDto, LinkedCollectionObjectResponse
} from './linked-collection-object.dto';
export class PostLinkedCollectionObjectDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsNotEmpty()
  @Expose()
  @ApiProperty({ type: [LinkedCollectionObjectDto] })
  data: LinkedCollectionObjectDto[];
  errors: any[];
}
export class PostLinkedCollectionObjectResponse{
  @ApiResponseProperty({ type: [LinkedCollectionObjectResponse] })
  data: LinkedCollectionObjectResponse[];

  @ApiResponseProperty({ type: LinkedCollectionRequestParamError })
  error: LinkedCollectionRequestParamError;
}