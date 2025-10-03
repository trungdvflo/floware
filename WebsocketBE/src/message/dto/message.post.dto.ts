import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateIf
} from 'class-validator';
import { IChatMarked, Persistence, QoS, SendOffline, SendType, Type } from '../../interface/message.interface';

export class MessageParam {
  @IsEnum(Type)
  @IsNotEmpty()
  event_type: string;

  @IsEnum(SendType)
  @IsNotEmpty()
  send_type: string;

  @IsNotEmpty()
  // @IsEnum(MessageCode) disable to allow extend message code from API 4.1
  @IsString()
  message_code: string;

  @IsOptional()
  metadata: any;

  @IsNotEmpty()
  @IsString()
  content: any;

  @IsArray()
  to: string[];

  @IsNumber()
  delay: number;

  @IsEnum(Persistence)
  @IsNotEmpty()
  persistence: Persistence;

  @IsEnum(QoS)
  @IsNotEmpty()
  qos?: number;

  @IsOptional()
  @IsEnum(SendOffline)
  send_offline?: number;

  @IsOptional()
  ignore_device_tokens?: string[];
}

export class ChatMessageParam {
  @IsOptional()
  metadata: any;

  @IsNotEmpty()
  @IsString()
  @ValidateIf((body) => !body.metadata?.attachments?.length && !body.marked)
  content: any;

  @IsNotEmpty()
  @IsString()
  channel: string;

  @IsOptional()
  @IsString()
  @IsUUID(4)
  parent_uid: string;

  @IsOptional()
  marked: IChatMarked;

  @IsOptional()
  external_message_uid: string;
}
