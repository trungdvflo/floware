export interface ILastModify {
  user_id: number;
  email: string;
  api_name: string;
  updated_date: number;
  collection_id?: number;
  channel_id?: number;
}
export interface IDeleteByCollection {
  itemType: string;
  collectionId: number;
  itemId: number;
  deleteDate: number;
}
export type ShareMemberLastModify = {
  memberId: number;
  email: string;
  updatedDate: number;
};