import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty } from 'class-validator';
import { LinkedObjectRequestParamError } from './error.dto';
import {
  LinkedObjectDto, LinkedObjectResponse
} from './linked-object.dto';
export class PostLinkedObjectDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsNotEmpty()
  @Expose()
  @ApiProperty({ type: [LinkedObjectDto] })
  data: LinkedObjectDto[];
  errors: any[];
}
export class PostLinkedObjectResponse{
  @ApiResponseProperty({ type: [LinkedObjectResponse] })
  data: LinkedObjectResponse[];

  @ApiResponseProperty({ type: LinkedObjectRequestParamError })
  error: LinkedObjectRequestParamError;
}
