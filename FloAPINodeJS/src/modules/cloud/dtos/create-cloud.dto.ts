import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsInt,
  IsNotEmpty, IsString, ValidateNested
} from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';
import { requestBody, RequestParam } from '../../../common/swaggers/cloud.swagger';
export class CreateCloudDTO {
  @IsString()
  @ApiProperty(RequestParam.bookmark_data)
  @Expose()
  bookmark_data: string;

  @IsString()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.real_filename)
  @Expose()
  real_filename: string;

  @IsString()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.ext)
  @Expose()
  ext: string;

  @IsString()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.device_uid)
  @Expose()
  device_uid: string;

  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.ref)
  @Expose()
  ref: string;

  @IsInt()
  @IsNotEmpty()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.size)
  @Expose()
  size: number;
}
export class CreateCloudSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: CreateCloudDTO,
    example: [requestBody]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: CreateCloudDTO[];
  errors: CreateCloudDTO[];
}