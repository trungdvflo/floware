import { Expose, Transform, Type } from 'class-transformer';
import { IsArray, IsEmail, IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, ValidateNested } from 'class-validator';
import { ChannelTypeNumber, REALTIME_STATUS, SORT_TYPE } from 'common/constants/system.constant';
import { TRIM_STRING_TRANSFORMER } from 'common/transformers/varbinary-string.transformer';
import { IsOptionalCustom } from 'decorators/class-validation.decorator';

export class ChatAttachmentDto {
  @Expose()
  @IsOptional()
  @IsString()
  name?: string;

  @Expose()
  @IsOptional()
  @IsString()
  type?: string;

  @IsNumber()
  @Expose()
  @IsOptional()
  size?: number;

  @Expose()
  @IsOptional()
  @IsString()
  url?: string;

  @Expose()
  @IsOptional()
  @IsString()
  file_uid?: string;
}

export class ChatLinkCollectionDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Expose()
  id?: number;
}

export class ChatMentionDto {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Transform(TRIM_STRING_TRANSFORMER)
  @Expose()
  email: string;

  @IsString()
  @IsNotEmpty()
  @Transform(TRIM_STRING_TRANSFORMER)
  @Expose()
  // @IsValidateMentionText()
  @IsOptionalCustom()
  mention_text?: string;
}
export class ChatLinkObjectDto {
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Expose()
  id?: number;
}
export class ChatMetadataDTO {
  @IsArray()
  @IsOptional()
  @Type(() => ChatAttachmentDto)
  @Expose()
  attachments?: ChatAttachmentDto[];

  @IsArray()
  @IsOptional()
  @Type(() => ChatMentionDto)
  @Expose()
  mentions?: ChatMentionDto[];

  @IsArray()
  @IsOptional()
  @Type(() => ChatLinkCollectionDto)
  @Expose()
  col_links?: ChatLinkCollectionDto[];

  @IsArray()
  @IsOptional()
  @Type(() => ChatLinkObjectDto)
  @Expose()
  obj_links?: ChatLinkObjectDto[];

  timestamp?: number;

}
export class MessageIntDTO {
  @Expose()
  @IsInt()
  internal_channel_id: number;

  @Expose()
  @IsEnum(ChannelTypeNumber)
  internal_channel_type: ChannelTypeNumber;

  @Expose()
  @IsOptionalCustom()
  @IsEnum(REALTIME_STATUS)
  is_realtime?: REALTIME_STATUS;

  @Expose()
  @IsString()
  @IsNotEmpty()
  msg: string;

  @IsOptionalCustom()
  @Expose()
  @Type(() => ChatMetadataDTO)
  @ValidateNested()
  metadata: ChatMetadataDTO;
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
  max_results: number;

  @Expose()
  @IsIn([SORT_TYPE.ASC, SORT_TYPE.DESC])
  @IsOptional()
  sort_order: string;

  @Expose()
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => +value || -1)
  not_after: number;

  @Expose()
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => +value || -1)
  not_before: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  next_token: string;
}