import { Transform } from 'class-transformer';
import { IsInt, Min } from 'class-validator';
import { IsOptionalCustom } from 'decorators/class-validation.decorator';

export class GetChannelDTO {
  @IsOptionalCustom()
  @IsInt()
  @Min(0)
  @Transform(({ value }) => Number(value))
  channel_id: number;
}