import { LinkedObject } from '../../../common/entities/linked-object.entity';

export const LinkedObjectProviders = {
  provide: 'LinkedObjectRepository',
  useValue: LinkedObject,
};
