import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  Max,
  ValidateIf,
  isString
} from 'class-validator';
import {
  CONFERENCE_FILTER_TYPE, NOTIFICATION_ACTION_ALLOW_FILTER,
  NOTIFICATION_ASSIGNMENT_FILTER, NOTIFICATION_STATUS, OBJECT_SHARE_ABLE
} from '../constants';
import { IsCommentObjectUid, IsOptionalCustom } from '../decorators';
import { RequestParam } from '../swaggers/base-get-all.swagger';
import { GeneralObjectId } from './object-uid';

export class BaseGetDTO {
  @IsInt()
  @IsPositive()
  @Max(1100)
  @ApiProperty(RequestParam.page_size)
  @Transform(({ value }) => +value)
  @Expose()
  public page_size: number;

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.modified_gte)
  @Transform(({ value }) => Number(value))
  @Expose()
  public modified_gte?: number;

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.modified_lt)
  @Transform(({ value }) => Number(value))
  @Expose()
  public modified_lt?: number;

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.before_time)
  @Transform(({ value }) => Number(value))
  @Expose()
  public before_time?: number;

  @IsNumber()
  @IsPositive()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.after_time)
  @Transform(({ value }) => Number(value))
  @Expose()
  public after_time?: number;

  @IsInt()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.min_id)
  @Transform(({ value }) => +value)
  @Expose()
  public min_id?: number;

  @IsInt()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.min_del_id)
  @Transform(({ value }) => +value)
  @Expose()
  public min_del_id?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.has_del)
  @IsInt()
  @IsIn([0, 1])
  @Transform(({ value }) => +value)
  @Expose()
  public has_del?: number;

  @IsOptionalCustom()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.ids)
  @Transform(({ value }) => isString(value) && value.split(',').map(v => Number(v)))

  @Expose()
  public ids?: number[];

  @IsOptionalCustom()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.fields)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      value = value.split(',');
    }
    return value.map(v => v.trim());
  })
  public fields?: string[];

  @IsOptionalCustom()
  @IsInt()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.ids)
  @Transform(({ value }) => {
    if (value === undefined) {
      return true;
    }
    return +value;
  }, { toPlainOnly: false })
  @Expose()
  public collection_id?: number;
}
export class BaseGetShortcutDTO extends BaseGetDTO {
  @IsOptionalCustom()
  @IsString()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.shortcut)
  public shortcut?: string;
}

export class BaseGetWithSortPagingDTO extends BaseGetDTO {
  @IsCommentObjectUid()
  @ApiPropertyOptional(RequestParam.object_uid)
  @IsOptionalCustom()
  object_uid?: GeneralObjectId;

  @IsString()
  @IsOptionalCustom()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.sort)
  @Expose()
  sort?: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.page_no)
  @Expose()
  page_no?: number;

  @IsPositive()
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.filter_type)
  @Expose()
  filter_type?: number;
}
export class BaseGetNotificationDTO extends BaseGetDTO {

  @IsString()
  @IsOptionalCustom()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.sort)
  @Expose()
  sort?: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.page_no)
  @Expose()
  page_no?: number;

  @IsPositive()
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.filter_type)
  @Expose()
  filter_type?: number;
  @IsOptional()
  @ApiProperty({ example: 'VTODO' })
  @IsArray()
  @IsEnum(OBJECT_SHARE_ABLE, { each: true })
  @Expose()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',') : value))
  object_type?: OBJECT_SHARE_ABLE[];

  @IsOptional()
  @IsArray()
  @ApiProperty({ example: '0' })
  @IsEnum(NOTIFICATION_STATUS, { each: true })
  @Expose()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map(Number) : value))
  status?: number[];

  @IsOptional()
  @IsArray()
  @ApiProperty({ example: '0' })
  @IsEnum(NOTIFICATION_ACTION_ALLOW_FILTER, { each: true })
  @Expose()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map(Number) : value))
  action?: number[];

  @IsOptional()
  @IsArray()
  @ApiProperty({ example: '0' })
  @IsEnum(NOTIFICATION_ASSIGNMENT_FILTER, { each: true })
  @Expose()
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map(Number) : value))
  assignment?: number[];

}

export class GetConferencePagingDTO extends BaseGetDTO {
  @IsOptionalCustom()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.collection_ids)
  @Transform(({ value }) => isString(value) && value.split(',').map(v => Number(v)))

  @Expose()
  collection_ids?: number[];

  @IsOptionalCustom()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.channel_ids)
  @Transform(({ value }) => isString(value) && value.split(',').map(v => Number(v)))
  @Expose()
  channel_ids?: number[];

  @ApiPropertyOptional(RequestParam.channel_uids)
  @IsOptionalCustom()
  @IsArray()
  @Transform(({ value }) => value?.split(',') || [])
  @Expose()
  channel_uids?: string[];

  @ApiPropertyOptional(RequestParam.keyword)
  @IsOptionalCustom()
  keyword?: string;

  @IsString()
  @IsOptionalCustom()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.sort)
  @Expose()
  sort?: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.page_no)
  @Expose()
  page_no?: number;

  @IsNumber()
  @IsInt()
  @IsIn(Object.values(CONFERENCE_FILTER_TYPE))

  @IsPositive()
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.filter_type)
  @Expose()
  filter_type?: number;

  @IsNumber()
  @IsInt()
  @IsIn([0, 1])
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.vip)
  vip?: number;

  @IsOptional()
  @ValidateIf((o) => o.filter_type > 1)
  @IsString()
  @ApiProperty({
    type: String, required: false,
    example: 'tester01@flomain.net,tester02@flomain.net'
  })
  @Type(() => String)
  @Expose()
  @Matches(`^((([\\w\._]+)@([\\w\-]+\.)+[\\w]{2,6}),?)+$`)
  emails?: string;
  @IsNumber()
  @IsInt()
  @IsIn([0, 1])
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.group_meeting)
  group_meeting?: number;
}

export class GetByCollectionIdDTO {
  @IsOptionalCustom()
  @IsInt()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.ids)
  @Transform(({ value }) => {
    if (value === undefined) {
      return true;
    }
    return +value;
  }, { toPlainOnly: false })
  @Expose()
  public collection_id?: number;
}

export class GetScheduleCallDTO extends BaseGetDTO {
  @IsString()
  @IsOptionalCustom()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.sort)
  @Expose()
  sort?: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.page_no)
  @Expose()
  page_no?: number;

  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.channel_ids)
  channel_id?: number;

  @IsString()
  @IsOptionalCustom()
  @ApiPropertyOptional()
  @Expose()
  external_meeting_id: string;
}