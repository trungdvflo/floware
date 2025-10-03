import { datatype } from 'faker';
import { OBJ_TYPE } from '../../../common/constants';
import { CollectionNotificationEntity } from '../../../common/entities';

export function fakeEntity(): Partial<CollectionNotificationEntity> {
  return {
    id: datatype.number(),
    user_id: 1,
    collection_id: datatype.number(),
    object_uid: Buffer.from('abc'),
    object_type: OBJ_TYPE.VEVENT,
    created_date: datatype.number(),
    updated_date: datatype.number(),
  };
}
