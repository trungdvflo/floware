import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { KanbanCard } from '../entities/kanban-card.entity';
import { KanbanCardOptionsInterface } from '../interfaces/kanban-card.interface';
const aliasName = 'kc';
@Injectable()
@CustomRepository(KanbanCard)
export class KanbanCardRepository extends Repository<KanbanCard> {
  async getMaxOrder(userId: number, kanbanId: number): Promise<number> {
    const rawObject = await this.createQueryBuilder('card')
      .select('MAX(card.order_number)', 'max')
      .where('card.user_id = :userId AND card.kanban_id = :kanbanId', { userId, kanbanId })
      .getRawOne();
    if (rawObject) return rawObject.max;
    return 0;
  }

  async findAllOnMaster(options: KanbanCardOptionsInterface) {
    const masterQueryRunner = this.manager.connection.createQueryRunner('master');
    try {
      const collectionItem = await this.createQueryBuilder(aliasName)
        .setQueryRunner(masterQueryRunner)
        .select(options.fields)
        .where(options.conditions).getRawMany();
      return collectionItem;
    } finally {
      await masterQueryRunner.release();
    }
  }
}
