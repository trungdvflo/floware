import { ApiProperty } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { SHARE_STATUS } from "../../../common/constants";
import { GetAllFilter } from "../../../common/dtos/get-all-filter";
import { RequestParam } from '../../../common/swaggers/base-get-all.swagger';
export class GetAllFilterMemberItem<T> extends GetAllFilter<T> {
  @IsNumber()
  @IsOptional()
  @IsNotEmpty()
  @Transform(({ value }) => Number(value))
  @ApiProperty(RequestParam.collection_id)
  public collection_id?: number;

  shared_status?: SHARE_STATUS;
}