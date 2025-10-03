export enum KanbanResponseMessage {
  KANBAN_NOT_FOUND = 'Kanban not found',
  COLLECTION_NOT_FOUND = 'The collection contains this kanban is not found',
  NOTHING_TO_UPDATE = 'Nothing to update',
  UPDATE_SYSTEM_KANBAN = 'Could not update system kanban',
  KANBAN_DELETED = 'This kanban has been already deleted',
  DUPLICATED_ENTRY = 'Duplicated kanban entry',
  DELETE_SYSTEM_KANBAN = 'Could not delete system kanban',
  FAIL_TO_CREATE_KANBAN = 'Fail to create kanban',
}

export enum KanbanErrorCode {
  KANBAN_NOT_FOUND = 'kanbanNotFound',
  COLLECTION_NOT_FOUND = 'kanbanCollectionNotFound',
  NOTHING_TO_UPDATE = 'kanbanNothingToUpdate',
  UPDATE_SYSTEM_KANBAN = 'kanbanUpdateSystemKanban',
  KANBAN_DELETED = 'kanbanAlreadyDeleted',
  KANBAN_ENTITY_ERROR = 'kanbanEntityError',
  DUPLICATED_ENTRY = 'kanbanDuplicatedEntry',
  DELETE_SYSTEM_KANBAN = 'kanbanDeleteSystemKanban',
  KANBAN_FAIL_TO_CREATE = 'kanbanFailToCreate',
}

export interface KanbanErrorInterface {
  code: KanbanErrorCode;
  message: KanbanResponseMessage;
}

export type KanbanErrorDicKey = 'KANBAN_NOT_FOUND' | 'COLLECTION_NOT_FOUND' |
  'NOTHING_TO_UPDATE' | 'UPDATE_SYSTEM_KANBAN' | 'KANBAN_DELETED' | 'DUPLICATED_ENTRY'
  | 'DELETE_SYSTEM_KANBAN' | 'KANBAN_FAIL_TO_CREATE';

export const KanbanErrorDics: Record<KanbanErrorDicKey, KanbanErrorInterface> = {
  KANBAN_NOT_FOUND: {
    code: KanbanErrorCode.KANBAN_NOT_FOUND,
    message: KanbanResponseMessage.KANBAN_NOT_FOUND
  },
  COLLECTION_NOT_FOUND: {
    code: KanbanErrorCode.COLLECTION_NOT_FOUND,
    message: KanbanResponseMessage.COLLECTION_NOT_FOUND
  },
  NOTHING_TO_UPDATE: {
    code: KanbanErrorCode.NOTHING_TO_UPDATE,
    message: KanbanResponseMessage.NOTHING_TO_UPDATE
  },
  UPDATE_SYSTEM_KANBAN: {
    code: KanbanErrorCode.UPDATE_SYSTEM_KANBAN,
    message: KanbanResponseMessage.UPDATE_SYSTEM_KANBAN
  },
  KANBAN_DELETED: {
    code: KanbanErrorCode.KANBAN_DELETED,
    message: KanbanResponseMessage.KANBAN_DELETED
  },
  DUPLICATED_ENTRY: {
    code: KanbanErrorCode.DUPLICATED_ENTRY,
    message: KanbanResponseMessage.DUPLICATED_ENTRY
  },
  DELETE_SYSTEM_KANBAN: {
    code: KanbanErrorCode.DELETE_SYSTEM_KANBAN,
    message: KanbanResponseMessage.DELETE_SYSTEM_KANBAN
  },
  KANBAN_FAIL_TO_CREATE: {
    code: KanbanErrorCode.KANBAN_FAIL_TO_CREATE,
    message: KanbanResponseMessage.FAIL_TO_CREATE_KANBAN
  },
};