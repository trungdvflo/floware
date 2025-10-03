import { DeletedItem } from '../../common/entities/deleted-item.entity';

export const collectionProvider = {
    provide: 'DeletedItemRepository',
    useValue: DeletedItem
};
