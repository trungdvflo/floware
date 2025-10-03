import { Expose, Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { SORT_TYPE } from '../../../common/constants';

export class MessageIntDTO {
  @Expose()
  @IsInt()
  internal_channel_id: number;

  @Expose()
  @IsInt()
  internal_channel_type: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  msg: string;
}

export class MessageIntDTOs {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => MessageIntDTO)
  @Expose()
  data: MessageIntDTO;
  errors: any[];
}

export class ListMessageIntDTO {
  @Expose()
  @IsInt()
  @Transform(({ value }) => +value)
  internal_channel_id: number;

  @Expose()
  @IsInt()
  @Transform(({ value }) => +value)
  internal_channel_type: number;

  @Expose()
  @IsInt()
  @IsOptional()
  @Transform(({ value }) => +value || 10)
  max_results?: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  next_token?: string;

  @Expose()
  @IsIn([SORT_TYPE.ASC, SORT_TYPE.DESC])
  @IsOptional()
  sort_order?: string;

  not_before?: number;
}