import { ApiProperty, PartialType, PickType } from '@nestjs/swagger';
import { KanbanCard } from '../../../common/entities/kanban-card.entity';
import { ResponseObject } from '../../../common/interfaces';
import { DeleteKanbanCardRequestParamError, KanbanCardRequestParamError } from './kanban-card-request-param-error';

export class DeleteKanbanCardItemResponse
  extends PartialType(PickType(KanbanCard, ['id'] as const)) {
  constructor(data: Partial<DeleteKanbanCardItemResponse>) {
    super();
    Object.assign(this, data);
  }
}

export class DeleteKanbanCardResponse implements ResponseObject<DeleteKanbanCardItemResponse> {
  @ApiProperty({ type: DeleteKanbanCardItemResponse, isArray: true  })
  public data: DeleteKanbanCardItemResponse[];

  @ApiProperty({ type: KanbanCardRequestParamError })
  public error?: DeleteKanbanCardRequestParamError;
}
