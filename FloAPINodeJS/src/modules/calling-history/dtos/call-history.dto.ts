import { Transform, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class VideoHistoryDTO {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Type(() => String)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      value = value.split(',');
    }
    return value.map(v => v.trim());
  })
  public invitee: string [];
}