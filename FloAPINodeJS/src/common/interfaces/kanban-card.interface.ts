import { KanbanCard } from "../entities/kanban-card.entity";

export interface KanbanCardOptionsInterface {
  fields: (keyof KanbanCard)[];
  conditions?: object;
}