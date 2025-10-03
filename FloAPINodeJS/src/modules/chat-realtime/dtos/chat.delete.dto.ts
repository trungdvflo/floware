import { ApiProperty } from "@nestjs/swagger";
import { Expose, Transform, Type } from "class-transformer";
import {
  ArrayMaxSize, ArrayMinSize, IsArray,
  IsDefined, IsEnum, IsInt, IsNotEmpty, IsNumber,
  IsPositive, IsString, ValidateNested
} from "class-validator";
import { ChannelTypeNumber } from "../../communication/interfaces";

export class DeleteChatDTO {
  @IsDefined()
  @IsEnum(ChannelTypeNumber)
  @Transform(({ value }) => Number(value))
  @Expose()
  channel_type: ChannelTypeNumber;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @Expose()
  channel_id: number;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Expose()
  @IsDefined()
  message_uid: string;
}

export class DeleteChatDTOs {
  @ApiProperty({
    type: [DeleteChatDTO]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  data: DeleteChatDTO[];
  errors: any[];
}