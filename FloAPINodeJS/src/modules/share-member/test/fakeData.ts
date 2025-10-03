import { datatype, internet } from 'faker';
import { ShareMember } from "../../../common/entities/share-member.entity";
import { UpdateStatusMemberDTO } from '../dtos/share-member-status.put.dto';
import { CreateMemberDTO } from '../dtos/share-member.post.dto';
import { UpdateMemberDTO } from '../dtos/share-member.put.dto';
import { UnShareDTO } from '../dtos/un-share.put.dto';

export function fakeEntity(): Partial<ShareMember> {
  return {
    id: datatype.number(),
    user_id: 1,
    collection_id: datatype.number(),
    calendar_uri: datatype.string(),
    access: 0,
    shared_status: 0,
    shared_email: internet.email(),
    member_user_id: datatype.number(),
    contact_uid: datatype.string(),
    contact_href: datatype.string(),
    account_id: 0,
    created_date: datatype.number(),
    updated_date: datatype.number(),
  };
}

export function fakeEntityByMember(): Partial<any> {
  return {
    id: datatype.number(),
    owner: internet.email(),
    collection_id: datatype.number(),
    access: 0,
    shared_email: internet.email(),
    created_date: datatype.number(),
    updated_date: datatype.number(),
  };
}

export function fakeCreatedDTO(): CreateMemberDTO {
  return {
    collection_id: datatype.number(),
    calendar_uri: datatype.string(),
    access: 0,
    shared_email: internet.email(),
    contact_uid: datatype.string(),
    contact_href: datatype.string(),
    account_id: 0,
  };
}

export function fakeUpdatedDTO(): UpdateMemberDTO {
  return {
    id: datatype.number(),
    access: 0,
    shared_status: 1
  };
}

export function fakeUpdatedStatusDTO(): UpdateStatusMemberDTO {
  return {
    collection_id: datatype.number(),
    shared_status: 1
  };
}

export function fakeUnShareDTO(): UnShareDTO {
  return {
    id: datatype.number(),
  };
}