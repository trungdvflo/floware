import { ApiProperty } from '@nestjs/swagger';
import { Kanban } from '../../../common/entities/kanban.entity';
import { ResponseObject } from '../../../common/interfaces';
import { KanbanRequestParamError } from './kanban-request-param-error';

export class KanbanWithRef extends Kanban {
  constructor(data: Partial<KanbanWithRef>) {
    super();
    Object.assign(this, data);
  }
  @ApiProperty({ example: '1234' })
  public ref: any;
}

export class CreateKanbanResponse implements ResponseObject<KanbanWithRef> {
  @ApiProperty({ type: KanbanWithRef, isArray: true  })
  public data: KanbanWithRef[];

  @ApiProperty({ type: KanbanRequestParamError })
  public error?: KanbanRequestParamError;
}
