import { datatype } from 'faker';
import { OBJ_TYPE } from '../../../common/constants';
import { GeneralObjectId } from '../../../common/dtos/object-uid';
import { CollectionActivity } from "../../../common/entities/collection-activity.entity";
import { MoveCollectionActivityDTO } from '../dtos/collection-activity.put.dto';

export function fakeEntity(): Partial<CollectionActivity> {
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

export function fakeUpdatedDTO(): MoveCollectionActivityDTO {
  return {
    collection_activity_id: datatype.number(),
    collection_id: datatype.number(),
    object_uid: new GeneralObjectId(
      {uid: "d5a68e33-ba04-11eb-a32e-5bed2a93fc42"}, OBJ_TYPE.VEVENT),
    action_time: datatype.number(),
    content: datatype.string(),
  };
}
