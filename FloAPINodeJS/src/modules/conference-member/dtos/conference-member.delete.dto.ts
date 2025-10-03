import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsInt,
  IsNotEmpty, IsNumber, IsPositive, ValidateNested
} from 'class-validator';
import { RequestParam } from '../../../common/swaggers/conference-member.swagger';

export class DeleteConferenceMemberDTO {

  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;

  @IsNumber()
  @IsPositive()
  @ApiProperty(RequestParam.revoke_time)
  @Expose()
  revoke_time: number;
}

export class DeleteConferenceMemberSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [DeleteConferenceMemberDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: DeleteConferenceMemberDTO[];
  errors: any[];
}