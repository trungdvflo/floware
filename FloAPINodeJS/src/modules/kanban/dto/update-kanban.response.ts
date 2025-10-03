import { ApiResponseProperty } from '@nestjs/swagger';
import { Kanban } from '../../../common/entities/kanban.entity';
import { ResponseObject } from '../../../common/interfaces';
import { UpdateKanbanRequestParamError } from './kanban-request-param-error';

export class UpdateKanbanResponse implements ResponseObject<Kanban> {
  @ApiResponseProperty()
  public data: Kanban[];

  @ApiResponseProperty()
  public error?: UpdateKanbanRequestParamError;
}
