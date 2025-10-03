import { datatype } from 'faker';
import { OBJ_TYPE } from '../../../common/constants/common';
import { RecentObject } from '../../../common/entities/recent-object.entity';

export const recentObjectsListData: Partial<RecentObject>[] =
  [
    {
      account_id: 999,
      id: datatype.number(),
      created_date: datatype.float(13),
      updated_date: datatype.float(13),
      object_href: datatype.string(10),
      object_type: OBJ_TYPE.VCARD,
      object_uid: datatype.uuid()
    }
  ];

export const createdRecentObjectListInput: Partial<RecentObject>[] =
  [
    {
      account_id: 1,
      object_href: datatype.string(10),
      object_type: OBJ_TYPE.VCARD,
      object_uid: datatype.uuid()
    }
  ];

export const getCreatedRecentObjectList = (input: Partial<RecentObject>[]) => {
  for (const data of input) {
    data.id = datatype.number();
    data.created_date = datatype.float(13);
    data.updated_date = datatype.float(13);
  }
  return input;
};