import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsEmail, IsIn, IsInt,
  IsNotEmpty, IsPositive, IsString, ValidateNested
} from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';
import { RequestParam } from '../../../common/swaggers/conference-member.swagger';

export class CreateConferenceMemberDTO {

  @IsInt()
  @IsPositive()
  @ApiProperty(RequestParam.channel_id)
  @Expose()
  channel_id: number;

  // @IsString()
  // @IsOptionalCustom()
  // @ApiProperty(RequestParam.uid)
  // @Expose()
  uid: string;

  @IsNotEmpty()
  @IsEmail()
  @ApiProperty(RequestParam.email)
  @Expose()
  email: string;

  @IsInt()
  @IsIn([0,1,2])
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.is_creator)
  @Expose()
  is_creator: number;

  // @IsString()
  // @IsOptionalCustom()
  // @ApiPropertyOptional(RequestParam.title)
  // @Expose()
  title: string;

  // @IsString()
  // @IsOptionalCustom()
  // @ApiPropertyOptional()
  // @Expose()
  description: string;

  // @IsString()
  // @IsOptionalCustom()
  // @ApiPropertyOptional()
  // @Expose()
  avatar: string;

  @IsOptionalCustom()
  @IsString()
  @ApiProperty(RequestParam.ref)
  @Expose()
  ref?: string;
}

export class CreateConferenceMemberSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: [CreateConferenceMemberDTO],
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: CreateConferenceMemberDTO[];
  errors: any[];
}