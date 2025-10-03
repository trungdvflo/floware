import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';
import { RequestParam } from '../../../common/swaggers/file-member.swagger';

export class FileMemberDownloadDTO {
  @IsNumber()
  @ApiProperty(RequestParam.collection_id)
  @Transform(({ value }) => +value)
  @Expose()
  collection_id: number;

  @IsString()
  @ApiProperty(RequestParam.uid)
  @Expose()
  uid: string;
}
