import { LinkedCollectionObject } from '../../../common/entities/linked-collection-object.entity';

export const LinkedCollectionObjectMemberProviders = {
  provide: 'CollectionObjectRepository',
  useValue: LinkedCollectionObject,
};
