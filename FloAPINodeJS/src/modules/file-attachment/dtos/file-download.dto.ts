import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class FileDownloadDTO {
  @IsString()
  @ApiProperty({ description: 'uid file name of item which want to get' })
  @Expose()
  uid: string;

  @IsString()
  @ApiProperty({ description: "Ex: '953dbc9f-fd40-4da9-94cb-ecb6d4a403e4@flodev.net'" })
  @Expose()
  client_id: string;
}
