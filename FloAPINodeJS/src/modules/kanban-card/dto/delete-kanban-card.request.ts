import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
    ArrayMaxSize, ArrayMinSize, IsArray, IsNotEmpty,
    ValidateNested
} from 'class-validator';
import { DeleteKanbanCardParam } from './kanban-card-param';

export class DeleteKanbanCardBatchRequest {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({ type: DeleteKanbanCardParam, isArray: true })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  public data: DeleteKanbanCardParam[];

  public errors: any[];
}
