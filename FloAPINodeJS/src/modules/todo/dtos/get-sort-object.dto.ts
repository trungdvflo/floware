import { ApiProperty, ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn, IsInt, IsNotEmpty, IsNumber, IsPositive, isString, Max
} from 'class-validator';
import { IsOptionalCustom } from '../../../common/decorators';
import { GetCommonRequestParam } from '../../../common/swaggers/get-param.swagger';
import { SortObjectDto } from '../../sort-object/dto/sort-object.dto';

export class GetSortObjectTodoDto {
  @ApiProperty(GetCommonRequestParam.page_size)
  @Max(1100)
  @IsPositive()
  @IsInt()
  @IsNotEmpty()
  @Transform(({ value }) => +value)
  page_size: number;

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
  @Transform(({ value }) => Number(value))
  public order_number?: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({
    example: 1,
    description: 'It\'s a number 1, get deleted items if you want to api return.\
                  Ex: &has_del=1, it will return the list Trash object deleted'
  })
  @IsIn([0,1])
  @Transform(({ value }) => Number(value))
  public has_del?: number;

  @ApiPropertyOptional(GetCommonRequestParam.min_id)
  @IsInt()
  @IsPositive()
  @IsOptionalCustom()
  @Transform(({ value }) => value ? +value : value)
  min_id?: number;

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
}

export class DeletedItemResponse {
  @ApiResponseProperty({ example: 123 })
  id: number;

  @ApiResponseProperty({ example: "0d644002-5bac-46ab-85dc-38ca49432089" })
  uid: string;

  @ApiResponseProperty({ example: "VTODO" })
  type: string;
}

class GetItemResponse extends SortObjectDto {
  @ApiResponseProperty({ example: 1 })
  id: number;
}

export class GetSortObjectResponseData {
  @ApiResponseProperty({ example: "0d644002-5bac-46ab-85dc-38ca49432089" })
  request_uid: string;

  @ApiResponseProperty({ type: [DeletedItemResponse] })
  deleted_objects: DeletedItemResponse[];

  @ApiResponseProperty({ type: [GetItemResponse] })
  objects: GetItemResponse[];
}