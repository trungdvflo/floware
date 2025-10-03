import { OmitType, PartialType } from '@nestjs/swagger';
import {
  LinkedCollectionObject
} from '../../../../common/entities/linked-collection-object.entity';
export class LinkedCollectionWithRef extends
  PartialType(OmitType(LinkedCollectionObject,
    ['object_uid'] as const)) {
  constructor(data: Partial<LinkedCollectionWithRef>) {
    super();
    Object.assign(this, data);
  }
  object_uid?: any;
  ref?: string | number;
}
