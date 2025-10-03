import { ApiPropertyOptional } from "@nestjs/swagger";
import { Expose, Transform, Type } from "class-transformer";
import { IsIn, IsInt, IsNumber, IsOptional, IsString, Matches } from "class-validator";
import { SORT_FIELD_FOR_CONFERENCE_HISTORY } from "../../../common/constants";
import { IsOptionalCustom } from "../../../common/decorators";
import { RequestParam } from "../../../common/swaggers/base-get-all.swagger";
import { TRIM_STRING_TRANSFORMER } from "../../../common/transformers/trim-string.transformer";
import { GetConferencePaging } from "../../conference-channel/dtos";

export class GetConferenceHistoryPaging<T> extends GetConferencePaging<T> {
  @IsString()
  @IsOptional()
  @Type(() => String)
  @ApiPropertyOptional(RequestParam.sort)
  @Expose()
  @Matches(`^[+-]?(${Object.values(SORT_FIELD_FOR_CONFERENCE_HISTORY).join('|')})$`)
  @Transform(TRIM_STRING_TRANSFORMER)
  sort?: string;

  @IsNumber()
  @IsInt()
  @IsIn([0, 1])
  @IsOptionalCustom()
  @Type(() => Number)
  @ApiPropertyOptional(RequestParam.group_meeting)
  group_meeting?: number;
}