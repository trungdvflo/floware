
import { string0To255 } from "aws-sdk/clients/customerprofiles";
import { OBJ_TYPE, SORT_OBJECT_TYPE } from "../constants/common.constant";
import { CloudEntity } from "../models/cloud.entity";
import { KanbanCardEntity } from "../models/kanban-card.entity";
import { KanbanEntity } from "../models/kanban.entity";
import { SortObjectEntity } from "../models/sort-object.entity";
import { UrlEntity } from "../models/url.entity";

export interface IResetObject {
  user_id: number;
  email: string;
  obj_type: OBJ_TYPE;
  request_uid: string;
  job_id?: number | string;
  data_input?: [];
}

export interface IResetOrderStatus {
  api_name: string;
  reset_fn: string;
}

export type SortAbleObject = (
  KanbanCardEntity
  | SortObjectEntity
  | KanbanEntity
  | CloudEntity
  | UrlEntity)
  & {
    uid?: string | Buffer;
    type?: string0To255;
    object_uid?: string | object;
    objOrder?: any;
    account_id?: number;
    object_href?: string;
  };

export interface ISortObject {
  request_uid: string;
  email: string;
  objects: SortAbleObject[];
  object_type: SORT_OBJECT_TYPE;
}