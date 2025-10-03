import { Expose, Transform } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GetChatingDTO {
  @Expose()
  @IsString()
  @IsNotEmpty()
  channel_arn: string;

  @Expose()
  @IsNotEmpty()
  @IsString()
  member_arn: string;

  @Expose()
  @IsNotEmpty()
  @Transform(({ value }) => +value)
  max_results: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  next_token: string;
}

export class GetDetailChatingDTO {
  @Expose()
  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => +value)
  channel_id: number;

  @Expose()
  @IsInt()
  @IsNotEmpty()
  @IsOptional()
  @Transform(({ value }) => +value || 10)
  max_results: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  next_token: string;
}
