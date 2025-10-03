import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEnum, IsNotEmpty, IsNumber, ValidateNested
} from 'class-validator';
import { MEMBER_SHARE_STATUS } from '../../../common/constants';
import { requestBodyStatusShareMember, RequestParam } from '../../../common/swaggers/share-member.swagger';

export class UpdateStatusMemberDTO {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty(RequestParam.id)
  @Expose()
  collection_id: number;

  @IsNumber()
  @IsEnum(MEMBER_SHARE_STATUS)
  @ApiProperty(RequestParam.member_shared_status)
  @Expose()
  shared_status: number;
}
export class UpdateStatusMemberSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: UpdateStatusMemberDTO,
    example: [requestBodyStatusShareMember]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: UpdateStatusMemberDTO[];
  errors: UpdateStatusMemberDTO[];
}