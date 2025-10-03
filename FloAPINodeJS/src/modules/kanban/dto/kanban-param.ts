import { ApiProperty, ApiPropertyOptional, OmitType, PartialType, PickType } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsDefined,
  IsEnum, IsInt, IsNotEmpty, IsNumber, IsPositive, IsString, Min
} from 'class-validator';
import { IsHexColorCustom, IsOptionalCustom, IsType } from '../../../common/decorators';
import { IsTrashDto } from '../../../common/dtos/isTrash.dto';
import { TransformArchiveTime, transformName } from '../../../common/utils/common';

export enum KanbanArchiveStatus {
  UNARCHIVED = 0,
  ARCHIVED = 1
}

export enum KanbanShowDoneTodo {
  HIDE = 0,
  SHOW = 1
}

export enum KanbanAddNewObjectType {
  TODO = 0,
  CONTACT = 1,
  NOTE = 2,
  EVENT = 3
}

export enum KanbanSortType {
  MANUAL = 0,
  ALPHABET = 1,
  OBJECT_TYPE = 2,
  DATE = 3
}

export enum KanbanType {
  NORMAL = 0,
  SYSTEM = 1,
}

export class KanbanParam extends IsTrashDto{
  @IsNotEmpty()
  @IsDefined()
  @IsString()
  @ApiProperty({ example: 'Untitled' })
  @Transform(transformName)
  @Expose()
  public name: string;

  @IsNotEmpty()
  @IsDefined()
  @ApiProperty({ example: '#d06a65' })
  @IsHexColorCustom()
  @Transform(transformName)
  @Expose()
  public color: string;

  @IsNotEmpty()
  @IsDefined()
  @IsInt()
  @Min(1)
  @ApiProperty({ example: 10 })
  @Expose()
  public collection_id: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({ example: 0, description: `
    0: Unarchived
    1: Archived
  `, default: 0
  })
  @IsEnum(KanbanArchiveStatus)
  @Expose()
  public archive_status: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({ example: 1669710560.268 })
  @Min(0)
  @IsNumber()
  @Expose()
  @Transform(TransformArchiveTime)
  public archived_time: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({ example: 0, description: `
    0: Hide
    1: Show
  `, default: 0
  })
  @IsEnum(KanbanShowDoneTodo)
  @Expose()
  public show_done_todo: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({ example: 0, description: `
    0: Todo
    1: Contact
    2: Note
    3: Event
  `, default: 0
  })
  @IsEnum(KanbanAddNewObjectType)
  @Expose()
  public add_new_obj_type: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({ example: 0, description: `
    0: Manual
    1: Alphabet
    2: Object Type
    3: Date
  `, default: 0
  })
  @IsEnum(KanbanSortType)
  @Expose()
  public sort_by_type: number;

  @IsOptionalCustom()
  @ApiPropertyOptional({ example: '1234' })
  @Expose()
  @IsType(['string' , 'number'])
  public ref?: string | number;
}

export class KanbanParamWithOrderNumber extends KanbanParam {
  @Expose()
  public order_number: number;
}

export class UpdateKanbanParam extends
  PartialType(OmitType(KanbanParam, ['collection_id', 'ref'] as const)) {
  @IsNotEmpty()
  @IsInt()
  @IsPositive()
  @ApiProperty({ example: 100 })
  @Expose()
  public id: number;
}

export class DeleteKanbanParam extends
  PartialType(PickType(UpdateKanbanParam, ['id'] as const)) {
}
