import { ApiProperty } from '@nestjs/swagger';
import { ResponseObject } from '../../../common/interfaces';
import { DeleteKanbanParam } from './kanban-param';
import { DeleteKanbanRequestParamError } from './kanban-request-param-error';

export class DeleteKanbanResponse implements ResponseObject<DeleteKanbanParam> {
  @ApiProperty({ type: DeleteKanbanParam, isArray: true })
  public data: DeleteKanbanParam[];

  @ApiProperty({ type: DeleteKanbanRequestParamError })
  public error?: DeleteKanbanRequestParamError;
}
