import { OmitType, PartialType } from '@nestjs/swagger';
import { LinkedObject } from '../../../../common/entities/linked-object.entity';

export class LinkedObjectWithRef extends
  PartialType(OmitType(LinkedObject, ['source_object_uid', 'destination_object_uid'] as const)) {
  constructor(data: Partial<LinkedObjectWithRef>) {
    super();
    Object.assign(this, data);
  }
  source_object_uid?: any;
  destination_object_uid?: any;
  ref: string | number;
}