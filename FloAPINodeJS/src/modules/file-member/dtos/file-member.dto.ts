import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { Equals, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { OBJ_TYPE } from "../../../common/constants";
import { RequestParam } from '../../../common/swaggers/file-member.swagger';
export class FileMemberDTO {
  @IsNumber()
  @ApiProperty(RequestParam.collection_id)
  @Transform(({ value }) => +value)
  @Expose()
  collection_id: number;

  @ApiProperty(RequestParam.file)
  @Expose()
  file: any;

  @IsString()
  @ApiProperty(RequestParam.object_uid)
  @Expose()
  object_uid: string;

  @IsString()
  @Equals(OBJ_TYPE.VJOURNAL)
  @ApiProperty(RequestParam.object_type)
  @Expose()
  object_type: string;

  @IsString()
  @IsOptional()
  @ApiProperty(RequestParam.uidCreate)
  @Expose()
  uid: string;

  @IsString()
  @IsOptional()
  @IsNotEmpty()
  @ApiProperty(RequestParam.local_path)
  @Expose()
  local_path: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @ApiProperty(RequestParam.client_id)
  @Expose()
  client_id: string;

  @IsOptional()
  @ApiProperty({ required: false})
  @Expose()
  ref: string | number;
}
