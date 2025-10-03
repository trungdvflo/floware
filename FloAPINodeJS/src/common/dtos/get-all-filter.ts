import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber, IsOptional, IsPositive,
  IsString, Matches, Max,
  Min,
  isString
} from 'class-validator';
import {
  COMMENT_FILTER_TYPE,
  OBJ_TYPE,
  SORT_FIELD_FOR_SCHEDULE_CALL,
  SORT_FIELD_FOR_SHARE
} from '../constants/common';
import { IsCommentObjectUid, IsLinkedObjectUid, IsOptionalCustom } from '../decorators';
import { RequestParam } from '../swaggers/base-get-all.swagger';
import { OBJECT_UID_LINKED_TRANSFORMER, OBJECT_UID_TRASH_TRANSFORMER } from '../transformers/object-uid.transformer';
import { TRIM_STRING_TRANSFORMER } from '../transformers/trim-string.transformer';
import { Email365ObjectId, GeneralObjectId, GmailObjectId, LINK_OBJ_TYPE, LINK_OBJ_TYPE_ARRAY } from './object-uid';
export class GetAllFilter<T> {
  @ApiProperty(RequestParam.page_size)
  @IsInt()
  @Min(1)
  @Max(1100)
  @Transform(({ value }) => Number(value))
  public page_size: number;

  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.modified_gte)
  @IsNumber()
  @Transform(({ value }) => Number(value))
  public modified_gte?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.modified_lt)
  @IsNumber()
  @Transform(({ value }) => Number(value))
  public modified_lt?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.min_id)
  @IsInt()
  @Transform(({ value }) => Number(value))
  public min_id?: number;

  @IsNumber()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.before_time)
  @Transform(({ value }) => Number(value))
  public before_time?: number;

  @IsNumber()
  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.after_time)
  @Transform(({ value }) => Number(value))
  public after_time?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.has_del)
  @IsIn([0, 1])
  @Transform(({ value }) => Number(value))
  public has_del?: number;

  @ApiPropertyOptional(RequestParam.ids)
  @IsOptionalCustom()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => String)
  @Transform(({ value }) => isString(value) && value.split(',').map(v => Number(v)))
  public ids?: number[];

  @IsOptionalCustom()
  @ApiPropertyOptional(RequestParam.fields)
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.split(',').map(v => v.trim()))
  public fields?: (keyof T)[];

  public remove_deleted?: boolean;

}
export class GetAllFilter4Shortcut<T> extends GetAllFilter<T> {
  @IsOptionalCustom()
  @IsString()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.shortcut)
  public shortcut?: string;
}

export class GetAllFilterWithSchedules<T> extends GetAllFilter<T> {
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

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.sort)
  @Expose()
  @Matches(`^[+-]?(${Object.values(SORT_FIELD_FOR_SCHEDULE_CALL).join('|')})$`)
  @Transform(TRIM_STRING_TRANSFORMER)
  sort?: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.page_no)
  @Expose()
  page_no?: number;
}
export class GetAllFilterWithSortPaging<T> extends GetAllFilter<T> {
  @ApiPropertyOptional(RequestParam.collection_id)
  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptionalCustom()
  @Type(() => Number)
  @Expose()
  public collection_id?: number;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.sort)
  @Expose()
  @Matches(`^[+-]?(${Object.values(SORT_FIELD_FOR_SHARE).join('|')})$`)
  @Transform(TRIM_STRING_TRANSFORMER)
  sort?: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.page_no)
  @Expose()
  page_no?: number;
}

export class GetAllFilter4CollectionAdnUID<T> extends GetAllFilterWithSortPaging<T> {
  @IsCommentObjectUid()
  @ApiPropertyOptional(RequestParam.object_uid)
  @IsOptionalCustom()
  @Transform(field => {
    if (Array.isArray(field.value)) {
      return false;
    }
    return OBJECT_UID_TRASH_TRANSFORMER(field);
  })
  object_uid?: GeneralObjectId;

  @IsOptionalCustom()
  @Type(() => Number)
  @IsIn(Object.values(COMMENT_FILTER_TYPE)
    .filter(x => typeof x === "number"))
  @ApiPropertyOptional(RequestParam.filter_type)
  @Expose()
  filter_type?: number;
}

export class GetAllFilter4Collection<T> extends GetAllFilter<T> {
  @IsInt()
  @IsPositive()
  @IsOptionalCustom()
  @Transform(({ value }) => Number(value))
  @ApiProperty(RequestParam.collection_id)
  public collection_id?: number;
}

export class GetAllFilterSortItem<T> {
  @ApiProperty({
    example: 50,
    description: 'It\'s a number integer, the number of item which want to get. In this version \
    will apply get object with page_size number. Value must be [1 - 1100]'
  })
  @IsInt()
  @Min(1)
  @Max(1100)
  @Transform(({ value }) => Number(value))
  public page_size: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({
    example: 1247872251.212,
    description: 'It\'s a number float, get items have updated_date greater than equal the time.'
  })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  public modified_gte?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({
    example: 1617874851.301,
    description: 'It\'s a number float, get item have updated_date Less Than the time.'
  })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  public modified_lt?: number;

  @IsOptionalCustom()
  @Min(0)
  @ApiPropertyOptional({
    example: 1,
    description: 'It\'s a number integer, it is trash ID which you want to get items have ID > min_id'
  })
  @IsInt()
  @Transform(({ value }) => Number(value))
  public min_id?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({
    example: 1,
    description: 'It\'s a number integer, it is trash ID which you want to get items have ID > min_id'
  })
  @Transform(({ value }) => Number(value))
  public order_number?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({
    example: 1,
    description: 'It\'s a number 1, get deleted items if you want to api return.\
                  Ex: &has_del=1, it will return the list Trash object deleted'
  })
  @IsIn([0, 1])
  @Transform(({ value }) => Number(value))
  public has_del?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'A text string, get items have ID in the list.\
    Ex: 123,432,456 It means api will return the object in the list ID'
  })
  @IsOptionalCustom()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => String)
  @Transform(({ value }) => isString(value) && value.split(',').map(v => Number(v)))
  public ids?: number[];

  public remove_deleted?: boolean;
}

export class GetAllFilterPlatFormSettingDefault<T> {
  @ApiProperty({
    example: 50,
    description: 'It\'s a number integer, the number of item which want to get. In this version \
    will apply get object with page_size number. Value must be [1 - 1100]'
  })
  @IsInt()
  @Min(1)
  @Max(1100)
  @Transform(({ value }) => Number(value))
  public page_size: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({
    example: 1247872251.212,
    description: 'It\'s a number float, get items have updated_date greater than equal the time.'
  })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  public modified_gte?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({
    example: 1617874851.301,
    description: 'It\'s a number float, get item have updated_date Less Than the time.'
  })
  @IsNumber()
  @Transform(({ value }) => Number(value))
  public modified_lt?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({
    example: 1,
    description: 'It\'s a number integer, it is trash ID which you want to get items have ID > min_id'
  })
  @IsInt()
  @Transform(({ value }) => Number(value))
  public min_id?: number;

  @ApiPropertyOptional({
    type: String,
    description: 'A text string, get items have ID in the list.\
    Ex: 123,432,456 It means api will return the object in the list ID'
  })
  @IsOptionalCustom()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => String)
  @Transform(({ value }) => isString(value) && value.split(',').map(v => Number(v)))
  public ids?: number[];

  @IsOptionalCustom()
  @ApiPropertyOptional({
    type: String,
    description: 'A text string, get items with some fields which you want to show.\
    You can follow the table above'
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @Type(() => String)
  @Transform(({ value }) => value.split(',').map(v => v.trim()))
  public fields?: (keyof T)[];
  @IsOptionalCustom()
  @ApiPropertyOptional({
    type: String,
    description: 'Version of client app'
  })
  @IsString()
  public app_version?: string;

  public app_reg_id?: string;
}
export class GetLinkedPaging<T> extends GetAllFilter<T> {
  @ApiPropertyOptional(RequestParam.collection_id)
  @IsOptionalCustom()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  collection_id?: number;

  @IsOptionalCustom()
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.channel_ids)
  channel_id?: number;

  @IsOptionalCustom()
  @IsNumber()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.uid)
  uid?: number;

  @IsOptionalCustom()
  @IsNotEmpty()
  @IsString()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.path)
  path?: string;

  @ApiPropertyOptional(RequestParam.object_type)
  @IsOptionalCustom()
  @IsNotEmpty()
  @IsString()
  @Transform(TRIM_STRING_TRANSFORMER)
  @IsIn(LINK_OBJ_TYPE_ARRAY)
  @ApiProperty({ example: OBJ_TYPE.VCARD })
  object_type?: LINK_OBJ_TYPE;

  @IsLinkedObjectUid()
  @ApiPropertyOptional(RequestParam.object_uid)
  @IsOptionalCustom()
  @Transform(field => {
    if (Array.isArray(field.value)) {
      return false;
    }
    return OBJECT_UID_LINKED_TRANSFORMER(field);
  })
  object_uid?: GeneralObjectId | GmailObjectId | Email365ObjectId;
}

export class GetByCollectionID<T> {
  @ApiPropertyOptional(RequestParam.collection_id)
  @IsNumber()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  @Expose()
  @Transform(({ value }) => +value)
  collection_id?: number;
}