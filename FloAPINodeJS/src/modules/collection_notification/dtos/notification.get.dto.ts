import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform, Type } from "class-transformer";
import { IsArray, IsEnum, IsIn, IsOptional } from "class-validator";
import {
  NOTIFICATION_ACTION_ALLOW_FILTER,
  NOTIFICATION_ASSIGNMENT_FILTER, NOTIFICATION_STATUS, OBJECT_SHARE_ABLE
} from "../../../common/constants";
import { IsOptionalCustom } from "../../../common/decorators";
import { GetAllFilterWithSortPaging } from "../../../common/dtos/get-all-filter";
import { RequestParam } from "../../../common/swaggers/base-get-all.swagger";

export class GetAllFilterCollectionNotification<T> extends GetAllFilterWithSortPaging<T> {
  @IsIn([0, 1])
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.is_web)
  @Expose()
  is_web?: number;

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