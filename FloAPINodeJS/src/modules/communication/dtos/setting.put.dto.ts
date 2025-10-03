import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import {
  IsDefined,
  IsEnum,
  IsObject,
  IsString,
  ValidateNested
} from "class-validator";
import {
  SETTING_NAME, SETTING_ONOFF
} from "../interfaces";

export class PutSettingDTO {

  @IsDefined()
  @IsString()
  @IsEnum(SETTING_NAME)
  @Expose()
  name: SETTING_NAME;

  @IsDefined()
  @IsString()
  @IsEnum(SETTING_ONOFF)
  @Expose()
  value: SETTING_ONOFF;
}

export class PutLastSeenDTOs {
  @ApiProperty({
    type: PutSettingDTO
  })
  @ValidateNested()
  @Type(() => PutSettingDTO)
  @IsObject()
  @Expose()
  data: PutSettingDTO;
  error: any[];
}