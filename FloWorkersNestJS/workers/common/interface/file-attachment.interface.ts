import { SHARE_OBJ_TYPE, SOURCE_TYPE_FILE_COMMON } from "../constants/common.constant";

export interface IWashabi {
  uid: string;
  ext: string;
}
export interface IDeleteWashabi extends IWashabi {
  id: number;
}

export interface IFileJob extends IWashabi {
  user_id: number;
}

export interface IFileCommonJob {
  user_id: number;
  source_id: number;
  collection_id: number;
  source_type: SOURCE_TYPE_FILE_COMMON;
}

export interface IFileCommonObjectJob {
  object_uid: Buffer;
  object_type: SHARE_OBJ_TYPE;
}