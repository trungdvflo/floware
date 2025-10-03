import { isEnum } from 'class-validator';
import { datatype } from 'faker';
import { DAV_OBJ_TYPE, OBJ_TYPE } from '../../../../common/constants/common';
import { GetAllFilter } from '../../../../common/dtos/get-all-filter';
import { LINK_OBJ_TYPE } from '../../../../common/dtos/object-uid';
import { LinkedObject } from '../../../../common/entities/linked-object.entity';
import { LinkHelper } from '../../helper/link.helper';
import { LinkedObjectDto } from '../dtos/linked-object.dto';
export function fakeFilter(): GetAllFilter<LinkedObject> {
  return {
    page_size: 10,
    has_del: 1
  };
}

export function fakeEntity(srcType: LINK_OBJ_TYPE, desType: LINK_OBJ_TYPE): Partial<LinkedObject> {
  const fakeDto = {
    id: datatype.number(),
    user_id: datatype.number(),
    source_object_uid: null,
    source_object_type: srcType,
    source_account_id: datatype.number(),
    source_object_href: null,
    destination_object_uid: null,
    destination_object_type: desType,
    destination_account_id: datatype.number(),
    destination_object_href: null,
    is_trashed: 0,
    created_date:datatype.number(),
    updated_date:datatype.number(),
  };
  fakeDto.source_object_uid = Buffer.from(datatype.string(15));
  fakeDto.destination_object_uid = Buffer.from(datatype.string(15));
  if (srcType === OBJ_TYPE.EMAIL) {
    const sUid = Buffer.alloc(8);
    sUid.writeUInt32BE(102);
    const sPath = Buffer.from('INBOX');
    fakeDto.source_object_uid = Buffer.concat([sUid, sPath]);
  }
  if (srcType === OBJ_TYPE.GMAIL) {
    fakeDto.source_object_uid = Buffer.from(datatype.string(15));
  }
  if (srcType === OBJ_TYPE.EMAIL365) {
    fakeDto.source_object_uid = Buffer.from(datatype.string(15));
  }
  if (isEnum(srcType, DAV_OBJ_TYPE)) {
    fakeDto.source_object_href = datatype.string(200);
    fakeDto.source_object_uid = Buffer.from(datatype.string(15));
  }
  if (desType === OBJ_TYPE.EMAIL) {
    const desUid = Buffer.alloc(8);
    desUid.writeUInt32BE(103);
    const desPath = Buffer.from('INBOX');
    fakeDto.destination_object_uid = Buffer.concat([desUid, desPath]);
  }
  if (desType === OBJ_TYPE.GMAIL) {
    fakeDto.destination_object_uid = Buffer.from(datatype.string(15));
  }
  if (desType === OBJ_TYPE.EMAIL365) {
    fakeDto.destination_object_uid = Buffer.from(datatype.string(15));
  }
  if (isEnum(desType, DAV_OBJ_TYPE)) {
    fakeDto.destination_object_href = datatype.string(200);
    fakeDto.destination_object_uid = Buffer.from(datatype.string(15));
  }
  return fakeDto;
}

export function fakeCreatedDTO(entity: Partial<LinkedObject>) : LinkedObjectDto {
  const srcUid =
  LinkHelper.getObjectUid(entity.source_object_uid,entity.source_object_type);
  const desUid =
  LinkHelper.getObjectUid(entity.destination_object_uid,entity.destination_object_type);
  const fakeDto = {
    source_object_uid: LinkHelper.transformObjectUid(srcUid, entity, 'source_object_type'),
    source_object_type: entity.source_object_type,
    source_account_id: entity.source_account_id,
    source_object_href: entity.source_object_href,
    destination_object_uid:LinkHelper.transformObjectUid(desUid, entity, 'destination_object_type'),
    destination_object_type: entity.destination_object_type,
    destination_account_id: entity.destination_account_id,
    destination_object_href: entity.destination_object_href,
    ref: datatype.string(200),
    is_trashed: entity.is_trashed
  };
  return fakeDto;
}
