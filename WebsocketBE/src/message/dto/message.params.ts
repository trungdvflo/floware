import { Expose, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf
} from 'class-validator';
import { IsNotDuplicateValue } from '../../common/decorators/validate-custom';
import { Status } from '../../interface/message.interface';
export class MessageItemParam {
  @IsNotEmpty()
  @MaxLength(300)
  @MinLength(5)
  messageUid: string;
}

export class MessageItemBody {
  @IsNotEmpty()
  @MaxLength(300)
  @MinLength(5)
  message_uid: string;
}
export class MessageItemContentBody {
  @IsNotEmpty()
  @MaxLength(300)
  @MinLength(5)
  message_uid: string;

  @IsNotEmpty()
  @ValidateIf((body) => !body.metadata?.attachments?.length)
  content: string;

  @IsOptional()
  metadata: any;
}

export class MessageItemQuery {
  @IsNotEmpty()
  @MaxLength(300)
  @MinLength(5)
  message_uid: string;
}

export class PagingQuery {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  @Max(300)
  page_size: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(0)
  page_no: number;
}

export class ChatMessageQuerySearch extends PagingQuery {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  after_sent_time: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  before_sent_time: number;

  @IsOptional()
  @IsString()
  order_by_sent_time: string;

  @IsOptional()
  jump_message_uid: string;

  @IsOptional()
  @IsString()
  @IsUUID(4)
  parent_uid: string;
}

export class MessageQuerySearch extends PagingQuery {
  @IsOptional()
  @Expose()
  @IsEnum(Status)
  @Type(() => Number)
  status: Status;

  @IsOptional()
  @Expose()
  @IsString()
  channel: string;
}

export class MessageStatusBody {
  @IsNotEmpty()
  @IsEnum(Status)
  status: Status;

  @IsOptional()
  @IsArray()
  @IsNotDuplicateValue()
  message_uid: string[];
}
