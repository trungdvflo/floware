import { DELETED_ITEM_TYPE, OBJ_TYPE } from "../constants/sort-object.constant";
export interface IDeleteLinksObject {
  user_id: number;
  email: string;
  object_uid: string;
  object_id: number;
  object_type: OBJ_TYPE;
}
export interface IDeleteObjectNoUid {
  user_id: number;
  item_id: number;
  item_type: DELETED_ITEM_TYPE;
  updated_date: number;
}
export interface IDeleteObjectUid extends IDeleteObjectNoUid {
  item_uid: string;
}

export interface IDeleteObjectMember {
  collection_id: number;
  collection_link_id: number;
  updated_date: number;
}