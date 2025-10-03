import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEmail,
  IsEnum, IsNotEmpty, IsNumber, IsOptional,
  IsString, Min, ValidateNested
} from 'class-validator';
import { MEMBER_ACCESS } from '../../../common/constants';
import { IsOptionalCustom } from '../../../common/decorators';
import { requestBody, RequestParam } from '../../../common/swaggers/share-member.swagger';

export class CreateMemberDTO {
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty(RequestParam.collection_id)
  @Expose()
  collection_id: number;

  @IsString()
  @IsNotEmpty()
  @ApiProperty(RequestParam.calendar_uri)
  @Expose()
  calendar_uri: string;

  @IsNumber()
  @IsNotEmpty()
  @IsEnum(MEMBER_ACCESS)
  @ApiProperty(RequestParam.access)
  @Expose()
  access: number;

  @IsString()
  @IsEmail()
  @IsNotEmpty()
  @ApiProperty(RequestParam.shared_email)
  @Expose()
  shared_email: string;

  @IsOptionalCustom()
  @IsString()
  @IsNotEmpty()
  @ApiProperty(RequestParam.contact_uid)
  @Expose()
  contact_uid: string;

  @IsOptionalCustom()
  @IsString()
  @IsNotEmpty()
  @ApiProperty(RequestParam.contact_href)
  @Expose()
  contact_href: string;

  @IsOptionalCustom()
  @Min(0)
  @ApiProperty(RequestParam.account_id)
  @Expose()
  account_id: number | 0;

  @IsOptional()
  @IsNotEmpty()
  @ApiProperty(RequestParam.ref)
  @Expose()
  ref?: string;
}
export class CreateMemberSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: CreateMemberDTO,
    example: [requestBody]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: CreateMemberDTO[];
  errors: CreateMemberDTO[];
}