export interface IDeleteItem {
  user_id: number;
  item_id?: number;
  item_uid?: string;
  item_type: string;
  created_date: number;
  updated_date: number;
}

export interface IItemDelete {
  itemId: number;
  collectionId: number;
  updatedDate: number;
}

export interface IDeleteDto {
  id: number;
}

export interface IDeleteFileMember {
  collection_id: number;
  uid: string;
}