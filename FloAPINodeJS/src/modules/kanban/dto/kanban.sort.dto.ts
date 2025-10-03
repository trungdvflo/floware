import { ApiProperty, ApiResponseProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray, IsInt,
  IsNotEmpty,
  IsObject, IsString,
  ValidateNested
} from 'class-validator';
import { SortObjectResponseMessage } from '../../../common/constants/message.constant';
import { IsOptionalCustom } from '../../../common/decorators';
import { ErrorDTO } from '../../../common/dtos/error.dto';
import { SortObjectDto } from '../../../modules/sort-object/dto/sort-object.dto';

export class KanbanSortObjectDataDto {
  @ApiProperty({
    example: '0d644002-5bac-46ab-85dc-38ca49432089',
    required: true
  })
  @IsString()
  @IsNotEmpty()
  request_uid: string;

  @ApiProperty({ type: [SortObjectDto] })
  @ArrayMaxSize(50)
  @ArrayMinSize(1)
  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => SortObjectDto)
  objects: SortObjectDto[];
}
export class KanbanSortObjectDto {
  @ApiProperty({ type: KanbanSortObjectDataDto })
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => KanbanSortObjectDataDto)
  data: KanbanSortObjectDataDto;
}

export class KanbanSortObjectResponseData {
  @ApiResponseProperty({ example: '0d644002-5bac-46ab-85dc-38ca49432089' })
  request_uid: string;

  @ApiResponseProperty({ example: SortObjectResponseMessage.SENT_SUCCESS })
  message: string;

  error: ErrorDTO;
}

export class KanbanSortObjectResponse {
  @ApiResponseProperty({
    example: KanbanSortObjectResponseData
  })
  data: KanbanSortObjectResponseData;
}

export class KanbanResetItemDTO {
  @IsInt()
  @Expose()
  collection_id: number;
}

export class KanbanResetDTO {
  @IsArray()
  @IsOptionalCustom()
  @ApiProperty({
    type: KanbanResetItemDTO,
    example: [{ collection_id: 1 }]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(50)
  data: KanbanResetItemDTO[];
}
