import { Column, Entity } from 'typeorm';
import { KanbanCard } from './kanban-card.entity';

@Entity({ name: 'kanban_card_deleted', synchronize: true })
export class KanbanCardDelete extends KanbanCard {
  @Column('datetime', { nullable: false })
  deleted_date: Date;
}
