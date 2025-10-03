import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty } from 'class-validator';
import { LinkedCollectionRequestParamError } from './error.dto';
import {
  LinkedCollectionObjectMemberDto, LinkedCollectionObjectResponse
} from './linked-collection-object-member.dto';
export class PostLinkedCollectionObjectMemberDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsNotEmpty()
  @Expose()
  @ApiProperty({ type: [LinkedCollectionObjectMemberDto] })
  data: LinkedCollectionObjectMemberDto[];
  errors: any[];
}
export class PostLinkedCollectionObjectMemberResponse{
  @ApiResponseProperty({ type: [LinkedCollectionObjectResponse] })
  data: LinkedCollectionObjectResponse[];

  @ApiResponseProperty({ type: LinkedCollectionRequestParamError })
  error: LinkedCollectionRequestParamError;
}