import { ICaldav } from "../../common/interface/calendar.interface";

export interface ICollection {
  user_id: number;
  email: string;
  collection_ids: number[];
}

export interface ICollectionMember {
  owner_id: number;
  email: string;
  collection_member_ids: number[];
}

export interface IChildCollection extends ICaldav {
  collectionType: number;
}
