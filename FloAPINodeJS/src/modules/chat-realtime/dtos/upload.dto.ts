import { ApiProperty } from "@nestjs/swagger";
import { Expose, Transform } from "class-transformer";
import { IsEnum, IsInt, IsNumber, IsString } from "class-validator";
import { IsOptionalCustom } from "../../../common/decorators";
import { ChannelTypeNumber } from "../../../modules/communication/interfaces";

export class ChimeFileDTO {
  @ApiProperty({
    type: 'file',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Binary file'
  })
  @Expose()
  file: any;

  @IsString()
  @Expose()
  message_uid: string;

  @IsInt()
  @Expose()
  @Transform(({ value }) => Number(value))
  channel_id: number;

  @IsNumber()
  @Expose()
  @Transform(({ value }) => Number(value))
  @IsEnum(ChannelTypeNumber)
  channel_type: ChannelTypeNumber;

  @IsOptionalCustom()
  @ApiProperty({ required: false})
  @Expose()
  ref?: string | number;
}