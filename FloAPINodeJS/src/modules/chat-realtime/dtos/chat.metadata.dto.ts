import { Expose, Type } from "class-transformer";
import {
  IsArray,
  IsDefined,
  IsInt, IsMimeType, IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID
} from "class-validator";

import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import {
  IsEmail,
  IsNotEmpty
} from "class-validator";
import { IsOptionalCustom } from "../../../common/decorators";
import { TRIM_STRING_TRANSFORMER } from "../../../common/transformers/trim-string.transformer";
import { IChatAttachment, IChatLink, IChatMarked, IChatMention, IChatMetadata } from "../../../modules/communication/interfaces";

export class ChatMentionDto implements IChatMention {
  @IsString()
  @ApiProperty({
    description: "Email of user has mentioned",
    example: 'anph@flomail.net'
  })
  @IsNotEmpty()
  @IsEmail()
  @Transform(TRIM_STRING_TRANSFORMER)
  @Expose()
  email: string;

  @IsString()
  @ApiProperty({
    description: "the @tag is used to mention someone in the shared collection.",
    example: '@anph'
  })
  @IsNotEmpty()
  @Transform(TRIM_STRING_TRANSFORMER)
  @Expose()
  // @IsValidateMentionText()
  @IsOptionalCustom()
  mention_text?: string;
}

export class ChatAttachmentDto implements IChatAttachment {
  @Expose()
  @IsOptional()
  @IsString()
  name?: string;

  @Expose()
  @IsOptional()
  @IsString()
  @IsMimeType()
  type?: string;

  @IsNumber()
  @Expose()
  @IsOptional()
  size?: number;

  @Expose()
  @IsOptional()
  @IsString()
  file_uid?: string;

  @Expose()
  @IsOptional()
  @IsString()
  ref?: string;
}

export class ChatLinkCollectionDto implements IChatLink {
  @IsInt()
  @IsPositive()
  @IsOptional()
  @Expose()
  @ApiProperty({ example: 1024 })
  id?: number;
}

export class ChatLinkObjectDto implements IChatLink {

  @IsInt()
  @IsPositive()
  @IsOptional()
  @Expose()
  @ApiProperty({ example: 1024 })
  id?: number;

}

export class ChatMetadataDTO implements IChatMetadata {

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

export class ChatMarkedDto implements IChatMarked {
  @Expose()
  @Type(() => String)
  @IsString()
  @IsUUID(4)
  @IsDefined()
  message_uid: string;

  @Expose()
  @IsString()
  @Type(() => String)
  @IsDefined()
  @IsNotEmpty()
  content_marked: string;
}