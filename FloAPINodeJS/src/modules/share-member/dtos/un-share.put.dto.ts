import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, IsNumber, ValidateNested
} from 'class-validator';
import { requestBodyUnShareMember, RequestParam } from '../../../common/swaggers/share-member.swagger';

export class UnShareDTO {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;
}
export class UhShareSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: UnShareDTO,
    example: [requestBodyUnShareMember]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: UnShareDTO[];
  errors: UnShareDTO[];
}