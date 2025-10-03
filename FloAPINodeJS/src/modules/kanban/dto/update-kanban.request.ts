import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty, ValidateNested
} from 'class-validator';
import { UpdateKanbanParam } from './kanban-param';
import { KanbanParamError } from './kanban-request-param-error';

export class UpdateKanbanBatchRequest {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({ type: UpdateKanbanParam, isArray: true })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  public data: UpdateKanbanParam[];

  public errors: KanbanParamError[];
}
