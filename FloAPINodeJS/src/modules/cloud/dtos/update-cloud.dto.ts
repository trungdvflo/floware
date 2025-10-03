import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize, IsArray, IsInt,

  IsNotEmpty, IsString,
  ValidateNested
} from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';
import { requestBodyUpdate, RequestParam } from '../../../common/swaggers/cloud.swagger';
export class UpdateCloudDTO {
  @IsInt()
  @ApiProperty(RequestParam.id)
  @Expose()
  id: number;

  @IsString()
  @IsOptionalCustom()
  @IsNotEmpty()
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
  @IsNotEmpty()
  @IsOptionalCustom()
  @ApiProperty(RequestParam.ext)
  @Expose()
  ext: string;

  @IsString()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.device_uid)
  @Expose()
  device_uid: string;

  @IsInt()
  @IsOptionalCustom()
  @IsNotEmpty()
  @ApiProperty(RequestParam.size)
  @Expose()
  size: number;
}
export class UpdateCloudSwagger {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    type: UpdateCloudDTO,
    example: [requestBodyUpdate]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: UpdateCloudDTO[];
  errors: UpdateCloudDTO[];
}