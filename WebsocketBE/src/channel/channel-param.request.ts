import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IsListEmail, IsNotDuplicateValue } from '../common/decorators/validate-custom';
import { Type } from '../interface/channel.interface';
import { PagingQuery } from '../message/dto/message.params';

export class ChannelItemParam {
  @IsNotEmpty()
  @MaxLength(100)
  @MinLength(5)
  @Matches(RegExp('^[a-zA-Z0-9-_]+$'))
  channelName: string;
}

export class QuerySearch extends PagingQuery {
  @IsOptional()
  @IsEnum(Type)
  type: string;

  @IsOptional()
  internal_channel_id: string;
}

export class ChannelMemberItemParam {
  @IsNotEmpty()
  @MaxLength(20)
  @MinLength(5)
  @Matches(RegExp('^[a-zA-Z0-9-_]+$'))
  channelName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}

export class CreateChannelParam {
  @IsNotEmpty()
  @MaxLength(100)
  @MinLength(5)
  @Matches(RegExp('^[a-zA-Z0-9-_]+$'))
  name: string;

  @IsNotEmpty()
  @MaxLength(200)
  @IsString()
  title: string;

  @IsEnum(Type)
  @IsNotEmpty()
  type: string;

  @IsNotEmpty()
  @IsNumber()
  internal_channel_id: number;

  @IsOptional()
  @IsArray()
  @IsListEmail()
  @IsNotDuplicateValue()
  members: string[];
}

export class ChannelMemberParam {
  @IsOptional()
  @IsArray()
  @IsListEmail()
  @IsNotDuplicateValue()
  members: string[];
}

export class UpdateChannelMemberParam {
  @IsOptional()
  @IsArray()
  @IsListEmail()
  @IsNotDuplicateValue()
  revoke_members: string[];
}
