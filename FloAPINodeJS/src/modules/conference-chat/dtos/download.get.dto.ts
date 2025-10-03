import { Expose, Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString
} from 'class-validator';
import { ChannelTypeNumber } from '../../../modules/communication/interfaces';

export class GetDownloadDto {
  @Expose()
  @IsInt()
  @IsPositive()
  @Transform(({ value }) => Number(value))
  channel_id: number;

  @IsNumber()
  @Expose()
  @Transform(({ value }) => Number(value))
  @IsEnum(ChannelTypeNumber)
  channel_type: ChannelTypeNumber;

  @Expose()
  @IsString()
  @IsNotEmpty()
  file_uid: string;
}