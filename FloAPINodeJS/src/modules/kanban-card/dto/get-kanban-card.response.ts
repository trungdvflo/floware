import { ApiProperty, OmitType, PartialType } from '@nestjs/swagger';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { KanbanCard } from '../../../common/entities/kanban-card.entity';
import { ResponseObject } from '../../../common/interfaces';

export class KanbanCardResponse extends
  PartialType(OmitType(KanbanCard, [] as const)) {
}

export class GetKanbanCardResponse implements ResponseObject<KanbanCardResponse> {
  @ApiProperty({ type: KanbanCard, isArray: true })
  public data: KanbanCardResponse[];

  @ApiProperty({ type: DeletedItem, isArray: true })
  public data_del: DeletedItem[];
}
