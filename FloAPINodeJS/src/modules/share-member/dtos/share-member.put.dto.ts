import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray,
  IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, ValidateNested
} from 'class-validator';
import { MEMBER_ACCESS, SHARE_STATUS } from '../../../common/constants';
import { requestBodyUpdateShareMember, RequestParam } from '../../../common/swaggers/share-member.swagger';

export class UpdateMemberDTO {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;

  @IsNumber()
  @IsNotEmpty()
  @IsEnum(MEMBER_ACCESS)
  @ApiProperty(RequestParam.access)
  @Expose()
  access: number;

  @IsNumber()
  @IsIn([SHARE_STATUS.REMOVED])
  @IsOptional()
  @ApiProperty(RequestParam.shared_status)
  @Expose()
  shared_status: number;
}
export class UpdateMemberSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: UpdateMemberDTO,
    example: [requestBodyUpdateShareMember]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: UpdateMemberDTO[];
  errors: UpdateMemberDTO[];
}