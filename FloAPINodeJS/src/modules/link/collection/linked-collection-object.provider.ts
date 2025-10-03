import { LinkedCollectionObject } from '../../../common/entities/linked-collection-object.entity';

export const LinkedCollectionObjectProviders = {
  provide: 'CollectionObjectRepository',
  useValue: LinkedCollectionObject,
};
