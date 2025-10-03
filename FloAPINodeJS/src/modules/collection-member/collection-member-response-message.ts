export enum CollectionMemberResponseMessage {
  COLLECTION_MEMBER_NOT_FOUND = 'Collection Member not found',
}

export enum CollectionMemberErrorCode {
  COLLECTION_MEMBER_NOT_FOUND = 'sharedCollectionNotFound',
}

export interface CollectionMemberErrorInterface {
  code: CollectionMemberErrorCode;
  message: CollectionMemberResponseMessage;
}

export type CollectionMemberErrorDicKey = 'COLLECTION_MEMBER_NOT_FOUND';

export const CollectionErrorDict: Record<
  CollectionMemberErrorDicKey,
  CollectionMemberErrorInterface
> = {
  COLLECTION_MEMBER_NOT_FOUND: {
    code: CollectionMemberErrorCode.COLLECTION_MEMBER_NOT_FOUND,
    message: CollectionMemberResponseMessage.COLLECTION_MEMBER_NOT_FOUND,
  },
};
