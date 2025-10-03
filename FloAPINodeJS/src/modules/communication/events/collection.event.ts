import { OBJECT_SHARE_ABLE } from "../../../common/constants";
import { EmailDTO } from "../../../common/dtos/email.dto";
import { GeneralObjectId } from "../../../common/dtos/object-uid";
import { Collection } from "../../../common/entities";
import { ChannelType } from "../interfaces";
import { RealTimeEvent, RealTimeEventMetadata } from "./real-time.event";

export interface CollectionEvent extends RealTimeEvent {
  collection: Collection;
  email: string;
  from: string;
  dateItem: number;
  type: ChannelType;
}

export interface TrashCollectionEvent {
  collection: Collection;
  email: string;
}

export interface RecoverCollectionEvent {
  collection: Collection;
  email: string;
}
export interface UpdateCollectionEvent extends TrashCollectionEvent {
  new_collection: Collection;
}

export interface ChangeRoleCollectionEvent {
  targetMember: string;
  changeByMember: string;
  access: number;
  collection_id: number;
  collection_name: string;
}

export interface CollectionEventMetadata extends RealTimeEventMetadata {
  email?: string;
  from?: string;
  collection_id: number;
  collection_name: string;
}

export interface CollectionObjectEvent {
    collection_id: number;
    collection_activity_id: number;
    object_href: string;
    content: string;
    object_type: OBJECT_SHARE_ABLE;
    object_uid: GeneralObjectId;
    action: number;
    action_time: number;
    assignees?: EmailDTO[];
    email: string;
}

export interface CommentObjectEvent {
  collection_id: number;
  collection_activity_id: number;
  object_href: string;
  content: string;
  object_type: OBJECT_SHARE_ABLE;
  object_uid: GeneralObjectId;
  action: number;
  action_time: number;
  assignees?: EmailDTO[];
  email: string;
}