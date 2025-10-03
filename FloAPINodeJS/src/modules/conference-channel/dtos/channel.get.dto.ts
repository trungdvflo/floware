import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform, Type } from "class-transformer";
import { IsArray, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, Matches, isString } from "class-validator";
import { CONFERENCE_FILTER_TYPE, SORT_FIELD_FOR_CONFERENCE } from "../../../common/constants";
import { IsOptionalCustom } from "../../../common/decorators";
import { GetAllFilter } from "../../../common/dtos/get-all-filter";
import { RequestParam } from "../../../common/swaggers/base-get-all.swagger";
import { TRIM_STRING_TRANSFORMER } from "../../../common/transformers/trim-string.transformer";

export class GetConferencePaging<T> extends GetAllFilter<T> {
  @ApiPropertyOptional(RequestParam.collection_ids)
  @IsOptionalCustom()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => String)
  @Transform(({ value }) => isString(value) && value.split(',').map(v => Number(v)))
  collection_ids?: number[];

  @IsOptionalCustom()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.channel_ids)
  @Transform(({ value }) => isString(value) && value.split(',').map(v => Number(v)))
  channel_ids?: number[];

  @ApiPropertyOptional(RequestParam.channel_uids)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value?.replace(/\+/g, '')
        .split(',').map(str => str.trim()) || [];
    }
    return value;
  })
  @Expose()
  channel_uids?: string[];

  @ApiPropertyOptional(RequestParam.keyword)
  @IsOptionalCustom()
  keyword?: string;

  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.sort)
  @Expose()
  @Matches(`^[+-]?(${Object.values(SORT_FIELD_FOR_CONFERENCE).join('|')})$`)
  @Transform(TRIM_STRING_TRANSFORMER)
  sort?: string;

  @IsNumber()
  @IsInt()
  @IsPositive()
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.page_no)
  page_no?: number;

  @IsNumber()
  @IsInt()
  @IsIn(Object.values(CONFERENCE_FILTER_TYPE)
    .filter(x => typeof x === "number"))
  @IsPositive()
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.filter_type)
  filter_type?: number;

  @IsOptional()
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
  @ApiPropertyOptional(RequestParam.vip)
  vip?: number;
}
