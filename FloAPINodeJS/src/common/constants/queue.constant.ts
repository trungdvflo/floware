export const QueueName = () => {
  return {
    CALDAV_QUEUE: `calDavQueue_v4_2`,
    COLLECTION_QUEUE: `collectionQueue_v4_2`,
    TRASH_QUEUE: `trashQueue_v4_2`,
    API_LAST_MODIFIED_QUEUE: `apiLastModifiedQueue_v4_2`,
    DELETE_OBJECT_QUEUE: `deleteObjectQueue_v4_2`,
    FILE_QUEUE: `fileQueue_v4_2`,
    SORT_OBJECT_QUEUE: `sortObjectQueue_v4_2`,
    RESET_ORDER_QUEUE: `resetOrderQueue_v4_2`,
    THIRD_PARTY_ACCOUNT_QUEUE: `thirdPartyAccountQueue_v4_2`,
    KANBAN_QUEUE: `kanbanQueue_v4_2`,
    WEB_SOCKET_QUEUE: `webSocketQueue`
  };
};

export enum THIRD_PARTY_ACCOUNT_WORKER_JOBS {
  LINKED_COLLECTION_OBJECT = 'COLLECTION_LINK',
  LINKED_OBJECT = 'LINK',
  SORT_OBJECT = 'ORDER_OBJ',
  CONTACT_HISTORY = 'HISTORY',
  EMAIL_TRACKING = 'TRACK',
  KANBAN = 'KANBAN',
  CANVAS = 'CANVAS',
  RECENT_OBJ = 'RECENT_OBJ'
}