export enum CollectionResponseMessage {
  COLLECTION_NOT_FOUND = 'Collection not found',
  COLLECTION_ICON_NOT_FOUND = 'Collection icon not found',
  PARENT_NOT_FOUND = 'Parent collection is not found',
  COLLECTION_TRASHED = 'Collection is trashed',
  PARENT_NOT_BELONGED = 'The parent collection is not belonged to this user',
  COLLECTION_LEVEL_EXCEEDED = 'The collection exceeds 7 levels',
  DUPLICATED_COLLECTION_NAME = 'Duplicated collection name at the same level',
  CALID_ALREADY_EXISTS = 'Collection having this calendar_uri already exists',
  DUPLICATED_CALID_BATCH = 'Duplicated calendar_uri in batch request',
  NOTHING_TO_UPDATE = 'Nothing to update',
  PARENT_ITSELF = 'Could not set itself as parent collection',
  PARENT_ARCHIVE_FOLDER = 'Unable to set parent for achive collection',
  ALREADY_DELETED = 'This collection has already been deleted',
  DUPLICATED_ENTRY = 'Duplicated collection entry',
  CIRCULAR_REFERENCE = 'Collection tree could not have circular reference',
  UNABLE_TO_SET_PARENT = 'Unable to set parent level for collection',
  UNABLE_TO_SET_CHILDREN = 'Unable to set children level for collection',
  DUPLICATED_ID_BATCH = 'Duplicated collection id'
}

export enum CollectionErrorCode {
  COLLECTION_NOT_FOUND = 'collectionNotFound',
  COLLECTION_ICON_NOT_FOUND = 'collectionIconNotFound',
  PARENT_NOT_FOUND = 'collectionParentNotFound',
  COLLECTION_TRASHED = 'collectionTrashed',
  COLLECTION_LEVEL_EXCEEDED = 'collectionLevelExceeded',
  DUPLICATED_COLLECTION_NAME = 'collectionDuplicatedName',
  CALID_ALREADY_EXISTS = 'collectionCalendarUriAlreadyExists',
  DUPLICATED_CALID_BATCH = 'collectionDuplicatedCalendarUriBatch',
  NOTHING_TO_UPDATE = 'collectionNothingToUpdate',
  PARENT_ITSELF = 'collectionParentItself',
  PARENT_ARCHIVE_FOLDER = 'unableToSetArchiveFolderParent',
  ALREADY_DELETED = 'collectionAlreadyDeleted',
  COLLECTION_ENTITY_ERROR = 'collectionEntityError',
  COLLECTION_SYSTEM_ERROR = 'collectionSystemError',
  DUPLICATED_ENTRY = 'collectionDuplicatedEntry',
  CIRCULAR_REFERENCE = 'collectionCircularReference',
  UNABLE_TO_SET_PARENT = 'unableToSetParent',
  UNABLE_TO_SET_CHILDREN = 'unableToSetChildren',
  DUPLICATED_ID_BATCH = 'collectionDuplicatedIdBatch',
}

export interface CollectionErrorInterface {
  code: CollectionErrorCode;
  message: CollectionResponseMessage;
}

export type CollectionErrorDicKey = 'COLLECTION_NOT_FOUND' | 'PARENT_NOT_FOUND' | 'COLLECTION_LEVEL_EXCEEDED' | 'COLLECTION_TRASHED' |
  'DUPLICATED_COLLECTION_NAME' | 'CALID_ALREADY_EXISTS' | 'DUPLICATED_CALID_BATCH' | 'NOTHING_TO_UPDATE' | 'PARENT_ITSELF' |
  'CIRCULAR_REFERENCE' | 'UNABLE_TO_SET_PARENT' | 'UNABLE_TO_SET_CHILDREN' | 'DUPLICATED_ID_BATCH' | 'ICON_INVALID' |
  'ALREADY_DELETED' | 'DUPLICATED_ENTRY' | 'CIRCULAR_REFERENCE';

export const CollectionErrorDict: Record<CollectionErrorDicKey, CollectionErrorInterface> = {
  ICON_INVALID: {
    code: CollectionErrorCode.COLLECTION_ICON_NOT_FOUND,
    message: CollectionResponseMessage.COLLECTION_ICON_NOT_FOUND
  },
  COLLECTION_NOT_FOUND: {
    code: CollectionErrorCode.COLLECTION_NOT_FOUND,
    message: CollectionResponseMessage.COLLECTION_NOT_FOUND
  },
  PARENT_NOT_FOUND: {
    code: CollectionErrorCode.PARENT_NOT_FOUND,
    message: CollectionResponseMessage.PARENT_NOT_FOUND
  },
  COLLECTION_TRASHED: {
    code: CollectionErrorCode.COLLECTION_TRASHED,
    message: CollectionResponseMessage.COLLECTION_TRASHED
  },
  COLLECTION_LEVEL_EXCEEDED: {
    code: CollectionErrorCode.COLLECTION_LEVEL_EXCEEDED,
    message: CollectionResponseMessage.COLLECTION_LEVEL_EXCEEDED
  },
  DUPLICATED_COLLECTION_NAME: {
    code: CollectionErrorCode.DUPLICATED_COLLECTION_NAME,
    message: CollectionResponseMessage.DUPLICATED_COLLECTION_NAME
  },
  CALID_ALREADY_EXISTS: {
    code: CollectionErrorCode.CALID_ALREADY_EXISTS,
    message: CollectionResponseMessage.CALID_ALREADY_EXISTS
  },
  DUPLICATED_CALID_BATCH: {
    code: CollectionErrorCode.DUPLICATED_CALID_BATCH,
    message: CollectionResponseMessage.DUPLICATED_CALID_BATCH
  },
  NOTHING_TO_UPDATE: {
    code: CollectionErrorCode.NOTHING_TO_UPDATE,
    message: CollectionResponseMessage.NOTHING_TO_UPDATE
  },
  PARENT_ITSELF: {
    code: CollectionErrorCode.PARENT_ITSELF,
    message: CollectionResponseMessage.PARENT_ITSELF
  },
  ALREADY_DELETED: {
    code: CollectionErrorCode.ALREADY_DELETED,
    message: CollectionResponseMessage.ALREADY_DELETED
  },
  DUPLICATED_ENTRY: {
    code: CollectionErrorCode.DUPLICATED_ENTRY,
    message: CollectionResponseMessage.DUPLICATED_ENTRY
  },
  CIRCULAR_REFERENCE: {
    code: CollectionErrorCode.CIRCULAR_REFERENCE,
    message: CollectionResponseMessage.CIRCULAR_REFERENCE
  },
  UNABLE_TO_SET_PARENT: {
    code: CollectionErrorCode.UNABLE_TO_SET_PARENT,
    message: CollectionResponseMessage.UNABLE_TO_SET_PARENT
  },
  UNABLE_TO_SET_CHILDREN: {
    code: CollectionErrorCode.UNABLE_TO_SET_CHILDREN,
    message: CollectionResponseMessage.UNABLE_TO_SET_CHILDREN
  },
  DUPLICATED_ID_BATCH: {
    code: CollectionErrorCode.DUPLICATED_ID_BATCH,
    message: CollectionResponseMessage.DUPLICATED_ID_BATCH
  },
};