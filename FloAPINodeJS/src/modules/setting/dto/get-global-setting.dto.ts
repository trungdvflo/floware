import { Transform, Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString } from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';
import { GlobalSetting } from '../../../common/entities';

export class GetGlobalSettingDto {
  @IsOptionalCustom()
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.split(',').map(v => v.trim()))
  public fields?: (keyof GlobalSetting)[];
}