import { ApiPropertyOptional, ApiResponseProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsString } from 'class-validator';
import { OBJ_TYPE } from '../../../common/constants';
import { GetAllFilterSortItem } from '../../../common/dtos/get-all-filter';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import {
  GET_SORT_OBJECT_TYPE,
  GET_SORT_OBJECT_TYPES, SORT_OBJECT_TYPE
} from '../sort-object.constant';
import { SortObjectTodoDto } from './sort-object.dto';

export class GetSortObjectDto extends GetAllFilterSortItem<any>{
  @ApiPropertyOptional({ isArray: true, enum: GET_SORT_OBJECT_TYPE })
  @IsString()
  @IsIn(GET_SORT_OBJECT_TYPES)
  object_type?: GET_SORT_OBJECT_TYPE;
}

export class DeletedItemResponse {
  @ApiResponseProperty({ example: 123 })
  id: number;

  @ApiResponseProperty({ example: "0d644002-5bac-46ab-85dc-38ca49432089" })
  uid: string;
}

export class GetSortObjectResponseData {

  @ApiResponseProperty({ type: [DeletedItem] })
  public data_del?: DeletedItem[];

  @ApiResponseProperty({ type: [SortObjectTodoDto] })
  data: SortObjectTodoDto[];
}

export class GetSortObjectResponse {
  @ApiResponseProperty({ type: [GetSortObjectResponseData] })
  data: GetSortObjectResponseData;
}

export class GetCheckStatusDto {
  @IsString()
  @ApiResponseProperty({ example: 'ce390e2e-87e6-4220-a297-0846349a2854' })
  request_uid: string;
}

export class GetCheckResetOrderStatusDto {
  @IsString()
  @ApiResponseProperty({ example: 'ce390e2e-87e6-4220-a297-0846349a2854' })
  request_uid: string;

  @IsString()
  @IsEnum(SORT_OBJECT_TYPE)
  @ApiResponseProperty({ example: OBJ_TYPE.CSFILE.toString() })
  sort_obj_type: string;
}
