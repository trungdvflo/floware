import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsNumber, ValidateNested
} from 'class-validator';
import { requestBodyLeaveShareMember, RequestParam } from '../../../common/swaggers/share-member.swagger';

export class LeaveShareDTO {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;
}
export class LeaveShareSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: LeaveShareDTO,
    example: [requestBodyLeaveShareMember]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: LeaveShareDTO[];
  errors: LeaveShareDTO[];
}