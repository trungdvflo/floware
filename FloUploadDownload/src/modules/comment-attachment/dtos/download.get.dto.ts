import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  IsNotEmpty,
  IsString
} from 'class-validator';

export class GetDownloadDto {
  @Expose()
  @ApiProperty({
    description: "uid file of item which want to download"
  })
  @IsString()
  @IsNotEmpty()
  uid: string;

}