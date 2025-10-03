import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  ArrayMaxSize, ArrayMinSize, IsArray, IsIn, IsInt, IsNotEmpty,
  IsOptional,
  ValidateNested
} from 'class-validator';
import { KanbanParam } from './kanban-param';
import { KanbanParamError } from './kanban-request-param-error';
export class CreateKanbanBatchRequest {
  @IsNotEmpty()
  @IsArray()
  @ApiProperty({ type: KanbanParam, isArray: true })
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @Expose()
  public data: KanbanParam[];

  @IsInt()
  @IsIn([0,1])
  @IsOptional()
  @Expose()
  @ApiProperty({type: Number, description: 'Create kanbans for owner or member'})
  public is_member: number;

  public errors: KanbanParamError[];
}
