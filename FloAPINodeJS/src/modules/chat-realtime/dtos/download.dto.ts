import { Expose, Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString
} from 'class-validator';
import { THUMBNAIL_TYPE } from '../../../common/constants';
import { IsOptionalCustom } from '../../../common/decorators';
import { ChannelTypeNumber } from '../../../modules/communication/interfaces';

export class ChatDownloadDTO {
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

  @IsOptionalCustom()
  @IsInt()
  @Transform(({ value }) => Number(value))
  @IsIn([THUMBNAIL_TYPE.isThump])
  @IsNotEmpty()
  thumb: number;
}