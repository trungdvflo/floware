import { Kanban } from '../../common/entities/kanban.entity';

export const kanbanProvider = {
    provide: 'KanbanRepository',
    useValue: Kanban
};
