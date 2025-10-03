import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform, Type } from "class-transformer";
import {
  IsDefined, IsEnum, IsInt, IsNotEmpty, IsNumber,
  IsOptional, IsPositive, IsString, IsUUID, Matches, Max, Min
} from "class-validator";
import { SORT_FIELD_FOR_CHAT_REALTIME } from "../../../common/constants";
import { IsOptionalCustom } from "../../../common/decorators";
import { RequestParam } from "../../../common/swaggers/base-get-all.swagger";
import { TRIM_STRING_TRANSFORMER } from "../../../common/transformers/trim-string.transformer";
import { ChannelTypeNumber } from "../../communication/interfaces";

export class GetChatDTO {
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

  @ApiProperty(RequestParam.page_size)
  @IsInt()
  @Min(1)
  @Max(1100)
  @Transform(({ value }) => Number(value))
  page_size: number;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.page_no)
  @Expose()
  page_no?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.before_time)
  @IsNumber()
  @Transform(({ value }) => Number(value))
  before_time?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.after_time)
  @IsNumber()
  @Transform(({ value }) => Number(value))
  after_time?: number;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.sort)
  @Expose()
  @Matches(`^[+-]?(${Object.values(SORT_FIELD_FOR_CHAT_REALTIME).join('|')})$`)
  @Transform(TRIM_STRING_TRANSFORMER)
  sort?: string;

  @IsString()
  @IsOptional()
  @IsUUID(4)
  @Type(() => String)
  @Expose()
  parent_uid?: string;
}

export class GetAttachmentDTO {
  @IsDefined()
  @IsInt()
  @IsNumber()
  @IsEnum(ChannelTypeNumber)
  @Transform(({ value }) => Number(value))
  channel_type: ChannelTypeNumber;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @Expose()
  channel_id: number;

  @ApiProperty(RequestParam.page_size)
  @IsInt()
  @Min(1)
  @Max(1100)
  @Transform(({ value }) => Number(value))
  public page_size?: number;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.page_no)
  @Expose()
  page_no?: number;
}

export class GetLastSeenDTO {
  @IsDefined()
  @IsInt()
  @IsNumber()
  @IsEnum(ChannelTypeNumber)
  @Transform(({ value }) => Number(value))
  channel_type: ChannelTypeNumber;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @Expose()
  channel_id: number;
}

export class GetChatMessageDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @Expose()
  @IsDefined()
  @IsUUID(4)
  message_uid: string;
}