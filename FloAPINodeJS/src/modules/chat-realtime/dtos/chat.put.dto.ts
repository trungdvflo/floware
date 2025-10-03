import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform, Type } from "class-transformer";
import {
  IsDefined,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  ValidateIf,
  ValidateNested
} from "class-validator";
import { IsValidateMentionInChat } from "../../../common/decorators";
import {
  ChannelTypeNumber
} from "../../communication/interfaces";
import { ChatMetadataDTO } from "./chat.metadata.dto";
import { validateChatMessage } from "./chat.post.dto";

export class PutChatDTO {
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

  @ApiPropertyOptional()
  @IsOptional()
  @Expose()
  @Type(() => ChatMetadataDTO)
  @ValidateNested()
  metadata: ChatMetadataDTO;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  @IsDefined()
  @Expose()
  @IsValidateMentionInChat()
  @ValidateIf(validateChatMessage)
  message_text: string;
}

export class PutLastSeenDTO {

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

export class PutChatDTOs {
  @ApiProperty({
    type: PutChatDTO
  })
  @ValidateNested()
  @Type(() => PutChatDTO)
  @IsObject()
  @Expose()
  data: PutChatDTO;
  errors: any[];
}

export class PutLastSeenDTOs {
  @ApiProperty({
    type: PutLastSeenDTO
  })
  @ValidateNested()
  @Type(() => PutLastSeenDTO)
  @Expose()
  @IsObject()
  data: PutLastSeenDTO;
  errors: any[];
}