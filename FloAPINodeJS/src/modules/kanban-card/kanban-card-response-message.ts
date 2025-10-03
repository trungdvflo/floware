export enum KanbanCardResponseMessage {
  KANBAN_CARD_NOT_FOUND = 'Kanban card not found',
  KANBAN_NOT_FOUND = 'The kanban contains this card is not found',
  NOTHING_TO_UPDATE = 'Nothing to update',
  THIRD_PARTY_ACCOUNT_NOT_FOUND = 'Third party account is not found',
  OBJECT_NOT_LINKED_TO_COLLECTION = 'Object is not linked to the collection of this kanban',
  DUPLICATED_ENTRY = 'Duplicated kanban card entry',
}

export enum KanbanCardErrorCode {
  KANBAN_CARD_NOT_FOUND = 'kanbanCardNotFound',
  KANBAN_NOT_FOUND = 'kanbanCardKanbanNotFound',
  NOTHING_TO_UPDATE = 'kanbanCardNothingToUpdate',
  THIRD_PARTY_ACCOUNT_NOT_FOUND = 'kanbanCardThirdPartyAccountNotFound',
  OBJECT_NOT_LINKED_TO_COLLECTION = 'kanbanCardObjectNotLinkedToCollection',
  KANBAN_CARD_ENTITY_ERROR = 'kanbanCardEntityError',
  DUPLICATED_ENTRY = 'kanbanCardDuplicatedEntry',
}

export interface KanbanCardErrorInterface {
  code: KanbanCardErrorCode;
  message: KanbanCardResponseMessage;
}

export type KanbanCardErrorDicKey = 'KANBAN_CARD_NOT_FOUND' | 'KANBAN_NOT_FOUND' |
  'NOTHING_TO_UPDATE' | 'THIRD_PARTY_ACCOUNT_NOT_FOUND' | 'OBJECT_NOT_LINKED_TO_COLLECTION' |
  'DUPLICATED_ENTRY';

export const KanbanCardErrorDics: Record<KanbanCardErrorDicKey, KanbanCardErrorInterface> = {
  KANBAN_CARD_NOT_FOUND: {
    code: KanbanCardErrorCode.KANBAN_CARD_NOT_FOUND,
    message: KanbanCardResponseMessage.KANBAN_CARD_NOT_FOUND
  },
  KANBAN_NOT_FOUND: {
    code: KanbanCardErrorCode.KANBAN_NOT_FOUND,
    message: KanbanCardResponseMessage.KANBAN_NOT_FOUND
  },
  NOTHING_TO_UPDATE: {
    code: KanbanCardErrorCode.NOTHING_TO_UPDATE,
    message: KanbanCardResponseMessage.NOTHING_TO_UPDATE
  },
  THIRD_PARTY_ACCOUNT_NOT_FOUND: {
    code: KanbanCardErrorCode.THIRD_PARTY_ACCOUNT_NOT_FOUND,
    message: KanbanCardResponseMessage.THIRD_PARTY_ACCOUNT_NOT_FOUND
  },
  OBJECT_NOT_LINKED_TO_COLLECTION: {
    code: KanbanCardErrorCode.OBJECT_NOT_LINKED_TO_COLLECTION,
    message: KanbanCardResponseMessage.OBJECT_NOT_LINKED_TO_COLLECTION
  },
  DUPLICATED_ENTRY: {
    code: KanbanCardErrorCode.DUPLICATED_ENTRY,
    message: KanbanCardResponseMessage.DUPLICATED_ENTRY
  }
};