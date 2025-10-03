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

export class KanbanCardSortObjectDataDto {
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
export class KanbanCardSortObjectDto {
  @ApiProperty({ type: KanbanCardSortObjectDataDto })
  @IsObject()
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => KanbanCardSortObjectDataDto)
  data: KanbanCardSortObjectDataDto;
}

export class KanbanCardSortObjectResponseData {
  @ApiResponseProperty({ example: '0d644002-5bac-46ab-85dc-38ca49432089' })
  request_uid: string;

  @ApiResponseProperty({ example: SortObjectResponseMessage.SENT_SUCCESS })
  message: string;

  error: ErrorDTO;
}

export class KanbanCardSortObjectResponse {
  @ApiResponseProperty({
    example: KanbanCardSortObjectResponseData
  })
  data: KanbanCardSortObjectResponseData;
}

export class KanbanCardResetItemDTO {
  @IsInt()
  @Expose()
  kanban_id: number;
}

export class KanbanCardResetDTO {
  @IsArray()
  @IsOptionalCustom()
  @ApiProperty({
    type: KanbanCardResetItemDTO,
    example: [{ kanban_id: 1 }]
  })
  @ValidateNested({ each: true })
  @ArrayMinSize(0)
  @ArrayMaxSize(50)
  data: KanbanCardResetItemDTO[];
}