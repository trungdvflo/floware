import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { FUNC_GENERATE_SYSTEM_KANBAN } from '../constants';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { Kanban } from '../entities/kanban.entity';
import { getPlaceholderByN } from '../utils/common';
@Injectable()
@CustomRepository(Kanban)
export class KanbanRepository extends Repository<Kanban> {

  async generateSystemKanban(collectionId: number,
    userId: number, bufferSize: number): Promise<number> {
    const { callType, spName, spParam } = FUNC_GENERATE_SYSTEM_KANBAN;
    const res = await this.manager
      .query(`${callType} ${spName}(${getPlaceholderByN(spParam)}) nReturn`, [
        userId,
        collectionId,
        bufferSize
      ]);

    return +res[0].nReturn || 0;
  }
}
