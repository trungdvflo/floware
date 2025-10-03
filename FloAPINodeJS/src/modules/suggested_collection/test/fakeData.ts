import { datatype } from 'faker';
import { SuggestedCollection } from '../../../common/entities/suggested_collection.entity';
import { DeleteSeggestedCollectionDTO } from '../dtos/suggested_collection.delete.dto';
import { CreateSuggestedCollectionDTO } from '../dtos/suggested_collection.post.dto';
import { UpdateSuggestedCollectionDTO } from '../dtos/suggested_collection.put.dto';

export function fakeEntity(): Partial<SuggestedCollection> {
  return {
    id: datatype.number(),
    user_id: 1,
    collection_id: datatype.number(),
    criterion_type: datatype.number(),
    criterion_value: datatype.string(),
    frequency_used: datatype.number(),
    created_date: datatype.number(),
    updated_date: datatype.number(),
  };
}

export function fakeCreatedDTO(): CreateSuggestedCollectionDTO {
  return {
    collection_id: datatype.number(),
    criterion_type: datatype.number(),
    criterion_value: datatype.string() || [],
    frequency_used: datatype.number(),
    action_time: datatype.number(),
    account_id: datatype.number(),
    third_object_uid: datatype.string(),
    third_object_type: datatype.number(),
    group_id: datatype.number(),
    object_type: datatype.string(),
    ref: '!@#$%'
  };
}

export function fakeUpdatedDTO(): UpdateSuggestedCollectionDTO {
  return {
    id: datatype.number(),
    frequency_used: 1,
    action_time: datatype.number(),
  };
}

export function fakeDeleteDTO(): DeleteSeggestedCollectionDTO {
  return {
    id: datatype.number(),
  };
}