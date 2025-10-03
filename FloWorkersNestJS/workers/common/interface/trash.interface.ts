import { IS_TRASHED } from "../constants/common.constant";
import { DELETED_ITEM_TYPE } from "../constants/sort-object.constant";
export interface ITrashLinkCollectionValue {
  object_uid?: Buffer;
  is_trashed?: IS_TRASHED;
}

export interface ITrashLinkObjectValue {
  source_object_uid?: Buffer;
  destination_object_uid?: Buffer;
  is_trashed?: IS_TRASHED;
}

export interface ITrashObject {
  object_id: number;
  object_type: DELETED_ITEM_TYPE;
}