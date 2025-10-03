import { Expose } from 'class-transformer';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { IsOptionalCustom } from 'decorators/class-validation.decorator';

export class CreateChannelDTO {
  @Expose()
  @IsInt()
  internal_channel_id: number;

  @Expose()
  @IsString()
  internal_title: string;

  @Expose()
  @IsInt()
  internal_channel_type: number;

  @Expose()
  @IsInt()
  @IsOptionalCustom()
  ref?: number;
}

export class CreateChannelDTOs {
  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  data: CreateChannelDTO[];
  errors: CreateChannelDTO[];
}