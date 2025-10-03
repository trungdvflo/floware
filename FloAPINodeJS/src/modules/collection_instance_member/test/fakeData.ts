import { datatype } from 'faker';
import { CollectionInstanceMember } from "../../../common/entities/collection-instance-member.entity";
import { DeleteCollectionInstanceMemberDTO } from '../dtos/collection-instance-member.delete.dto';
import { CreateCollectionInstanceMemberDTO } from '../dtos/collection-instance-member.post.dto';
import { UpdateCollectionInstanceMemberDTO } from '../dtos/collection-instance-member.put.dto';

export function fakeEntity(): Partial<CollectionInstanceMember> {
  return {
    id: datatype.number(),
    user_id: 1,
    collection_id: datatype.number(),
    favorite: datatype.number(),
    color: datatype.string(),
    is_hide: datatype.number(),
    recent_time: datatype.number(),
    created_date: datatype.number(),
    updated_date: datatype.number(),
  };
}

export function fakeCreatedDTO(): CreateCollectionInstanceMemberDTO {
  return {
    collection_id: datatype.number(),
    favorite: datatype.number(),
    color: datatype.string(),
    is_hide: datatype.number(),
    recent_time: datatype.number(),
    ref: '!@#$%'
  };
}

export function fakeUpdatedDTO(): UpdateCollectionInstanceMemberDTO {
  return {
    id: datatype.number(),
    favorite: datatype.number(),
    color: datatype.string(),
    is_hide: datatype.number(),
    recent_time: datatype.number(),
  };
}

export function fakeDeleteDTO(): DeleteCollectionInstanceMemberDTO {
  return {
    id: datatype.number(),
  };
}