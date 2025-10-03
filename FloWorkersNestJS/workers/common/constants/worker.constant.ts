export const WORKER_THIRD_PARTY_ACCOUNT = {
  NAME: 'Worker third party account',
  QUEUE: 'thirdPartyAccountQueue_v4_2',
  JOB: {
    CONCURRENCY: 2,
    NAME: {
      COLLECTION_LINK: 'COLLECTION_LINK',
      RECENT_OBJ: 'RECENT_OBJ',
      LINK: 'LINK',
      ORDER_OBJ: 'ORDER_OBJ',
      HISTORY: 'HISTORY',
      TRACK: 'TRACK',
      CANVAS: 'CANVAS'
    }
  }
};
export const WORKER_TRASH = {
  NAME: 'Worker trash collection',
  QUEUE: 'trashQueue_v4_2',
  JOB: {
    CONCURRENCY: 1,
    NAME: {
      TRASH_AFTER_CREATE: 'aftercreated',
      TRASH_AFTER_DELETE: 'afterdeleted',
      TRASH_AFTER_RECOVER: 'afterrecovered'
    }
  }
};

export const DELETE_OBJECT_QUEUE = 'deleteObjectQueue_v4_2';
export const DELETE_OBJECT_JOB = {
  CONCURRENCY: 4,
  NAME: "deleteObjectJob"
};

export const WORKER_KANBAN = {
  NAME: 'Worker Kanban',
  DELETE_QUEUE: 'kanbanQueue_v4_2',
  CREATE_SYSTEM_QUEUE: 'collectionCreateKanbanQueue_v4_2',
  DELETE_JOB: {
    NAME: 'deleteKanban',
    CONCURRENCY: 10,
  },
  CREATE_SYSTEM_JOB: {
    NAME: 'createSystemKanbanOfCollection',
    CONCURRENCY: 4,
  }
};

export const WORKER_API_LAST_MODIFIED = {
  NAME: 'Worker last modify',
  QUEUE: 'apiLastModifiedQueue_v4_2',
  JOB: {
    NAME: 'apiLastModified',
    COLLECTION: 'apiLastModifiedSharedCollection',
    CONFERENCE: 'apiLastModifiedConference',
    CONCURRENCY: 10,
  }
};

export const WORKER_REPORT_CACHED_USER = {
  NAME: 'Worker report cache user',
  QUEUE: 'reportCachedUserQueue',
  JOB: {
    NAME: 'reportCachedUserJob',
    CONCURRENCY: 2,
  }
};

export const LIST_CRONJOB = {
  PUSH_CHANGE: 'cron_push_change'
};

export const WORKER_OBJECT = {
  NAME: 'Worker object',
  RESET_QUEUE: 'resetOrderQueue_v4_2',
  SORT_QUEUE: 'sortObjectQueue_v4_2',
  RESET_JOB: {
    NAME: 'ResetOrderQueue',
    CONCURRENCY: 4,
  },
  SORT_JOB: {
    NAME: 'SortObjectQueue',
    CONCURRENCY: 5
  },
  CACHE_SORT_KEY: 'SortOrder'
};

export const WORKER_COLLECTION = {
  NAME: 'Worker collection',
  QUEUE: 'collectionQueue_v4_2',
  COLLECTION_TREE_JOB: {
    NAME: 'deleteCollectionTree',
    CONCURRENCY: 10,
  },
  COLLECTION_MEMBER_JOB: {
    NAME: 'deleteCollectionMember',
    CONCURRENCY: 6,
  }
};

export const WORKER_CHILD_COLLECTION = {
  NAME: 'Worker collection',
  QUEUE: 'collectionDeleteChildDataQueue_v4_2',
  DELETE_CHILD_JOB: {
    NAME: 'collectionDeleteChildData',
    CONCURRENCY: 10,
  }
};

export const WORKER_CALDAV_QUEUE = {
  NAME: 'Worker Caldav',
  QUEUE: 'calDavQueue_v4_2',
  CALDAV_JOB: {
    NAME: 'deleteWebCalendar',
    CONCURRENCY: 10,
  },
};

export const WORKER_INVALID_DATA_DELETION = {
  NAME: 'Worker Delete Invalid Link',
  QUEUE: 'invalidLinkDeletion_v4_2',
  CONCURRENCY: 3,
  JOB: {
    NAME: 'deleteInvalidLink',
  },
};

export const WORKER_INVALID_FLO_MAIL_COLLECTOR = {
  NAME: 'Worker Invalid Link Flo Mail Collector',
  QUEUE: 'invalidLinkFloMailCollector_v4_2',
  CONCURRENCY: 1,
  JOB: {
    DELETED_MAIL: 'deleteMailTriggerJob',
    RMV_CONSIDERING: 'deleteMailConsideringJob'
  },
};

export const WORKER_INVALID_FLO_OBJECT_COLLECTOR = {
  NAME: 'Worker Invalid Link Flo Object Collector',
  QUEUE: 'invalidLinkFloObjectCollector_v4_2',
  CONCURRENCY: 1,
  JOB: {
    NAME: 'collectInvalidLink',
  },
};

export const INVALID_LINK_FLOMAIL_FINDER = {
  NAME: 'Worker Email Check Existed',
  QUEUE: 'invalidLinkFloMailFinder_v4_2',
  CONCURRENCY: 2,
  JOB: {
    NAME: 'checkExistedEmail',
  },
};

export const NOTIFICATION_OUTDATED_CLEANER = {
  NAME: 'Worker Notification Outdated Finder',
  QUEUE: 'outdatedCollectionNotificationCleaner_v4_2',
  CONCURRENCY: 5,
  JOB: {
    NAME: 'outdatedCollectionNotificationFinder'
  },
};
