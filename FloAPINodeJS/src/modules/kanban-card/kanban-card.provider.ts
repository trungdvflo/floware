import { KanbanCardRepository } from '../../common/repositories/kanban-card.repository';

export const kanbanCardProvider = {
    provide: 'KanbanCardRepository',
    useValue: KanbanCardRepository
};
