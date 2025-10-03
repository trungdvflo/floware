import { ApiProperty } from '@nestjs/swagger';
import { DeletedItem } from '../../../common/entities/deleted-item.entity';
import { Kanban } from '../../../common/entities/kanban.entity';
import { ResponseObject } from '../../../common/interfaces';

export class GetKanbanResponse implements ResponseObject<Kanban> {
  @ApiProperty({ type: Kanban, isArray: true })
  public data: Kanban[];

  @ApiProperty({ type: DeletedItem, isArray: true })
  public data_del: DeletedItem[];
}
