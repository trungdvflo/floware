import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt,
  IsNotEmpty, IsPositive, ValidateNested
} from 'class-validator';
import { RequestParam } from '../../../common/swaggers/conference-member.swagger';

export class UpdateConferenceMemberDTO {

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;

  @IsInt()
  @IsIn([0,1])
  @ApiProperty(RequestParam.is_creator)
  @Expose()
  is_creator: number;
}

export class UpdateConferenceMemberSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [UpdateConferenceMemberDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: UpdateConferenceMemberDTO[];
  errors: any[];
}