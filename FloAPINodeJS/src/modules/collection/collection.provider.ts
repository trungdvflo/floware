import { Collection } from '../../common/entities/collection.entity';

export const collectionProvider = {
    provide: 'CollectionRepository',
    useValue: Collection
};
