import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
    ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty,
    ValidateNested
} from 'class-validator';
import { DeleteKanbanParam } from './kanban-param';

export class DeleteKanbanBatchRequest {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({ type: DeleteKanbanParam, isArray: true })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  public data: DeleteKanbanParam[];

  public errors: any[];
}
