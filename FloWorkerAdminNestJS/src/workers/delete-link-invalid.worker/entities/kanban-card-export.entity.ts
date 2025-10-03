import { Column, Entity } from 'typeorm';
import { KanbanCard } from './kanban-card.entity';

@Entity({ name: 'kanban_card_exported', synchronize: true })
export class KanbanCardExport extends KanbanCard {
  @Column('datetime', { nullable: false })
  export_date: Date;
}
