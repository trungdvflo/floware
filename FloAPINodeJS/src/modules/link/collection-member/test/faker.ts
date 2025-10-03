import { isEnum } from 'class-validator';
import { datatype } from 'faker';
import { DAV_OBJ_TYPE, OBJ_TYPE } from '../../../../common/constants/common';
import { GetAllFilter } from '../../../../common/dtos/get-all-filter';
import { LINK_OBJ_TYPE } from '../../../../common/dtos/object-uid';
import {
  LinkedCollectionObject
} from '../../../../common/entities/linked-collection-object.entity';
import { LinkHelper } from '../../helper/link.helper';
import { LinkedCollectionObjectMemberDto } from '../dtos/linked-collection-object-member.dto';
export function fakeFilter(): GetAllFilter<LinkedCollectionObject> {
  return {
    page_size: 10,
    has_del: 1
  };
}

export function fakeEntity(type: LINK_OBJ_TYPE): Partial<LinkedCollectionObject> {
  const fakeDto = {
    id: datatype.number(),
    user_id: datatype.number(),
    collection_id: datatype.number(),
    object_uid: undefined,
    object_type: type,
    email_time: datatype.number(),
    account_id: datatype.number(),
    object_href: undefined,
    is_trashed: 0,
  };
  if (type === OBJ_TYPE.EMAIL) {
    const uid = Buffer.alloc(8);
    uid.writeUInt32BE(203);
    const path = Buffer.from('INBOX');
    fakeDto.object_uid = Buffer.concat([uid, path]);
  } else if (type === OBJ_TYPE.GMAIL) {
    fakeDto.object_uid = Buffer.from(datatype.string(15));
  } else if (isEnum(type, DAV_OBJ_TYPE)) {
    fakeDto.object_href = datatype.string(200);
    fakeDto.object_uid = Buffer.from(datatype.string(15));
  } else {
    fakeDto.object_uid = Buffer.from(datatype.string(15));
  }
  return fakeDto;
}

export function fakeCreatedDTO(entity: Partial<LinkedCollectionObject>)
  : LinkedCollectionObjectMemberDto {
  const objUid =
    LinkHelper.getObjectUid(entity.object_uid, entity.object_type);
  const fakeDto = {
    collection_id: entity.collection_id,
    object_uid: LinkHelper.transformObjectUid(objUid, entity, 'object_type'),
    object_type: entity.object_type,
    account_id: entity.account_id,
    email_time: entity.email_time,
    object_href: entity.object_href,
    ref: datatype.string(200),
    is_trashed: entity.is_trashed
  };
  return fakeDto;
}
