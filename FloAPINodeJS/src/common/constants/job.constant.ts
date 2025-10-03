export enum JobName {
  // CALDAV
  CREATE_NOTE = 'createNote',
  UPDATE_NOTE = 'updateNote',
  DELETE_NOTE = 'deleteNote',
  MOVE_NOTE = 'moveNote',

  CREATE_TODO = 'createTodo',
  UPDATE_TODO = 'updateTodo',
  DELETE_TODO = 'deleteTodo',
  MOVE_TODO = 'moveTodo',

  CREATE_EVENT = 'createEvent',
  UPDATE_EVENT = 'updateEvent',
  DELETE_EVENT = 'deleteEvent',
  MOVE_EVENT = 'moveEvent',

  // CARDDAV
  CREATE_CONTACT = 'createContact',
  UPDATE_CONTACT = 'updateContact',
  DELETE_CONTACT = 'deleteContact',

  // trash
  TRASH_AFTER_CREATE = 'aftercreated',
  TRASH_AFTER_DELETE = 'afterdeleted',
  TRASH_AFTER_RECOVER = 'afterrecovered',

  API_LAST_MODIFIED = 'apiLastModified',
  API_LAST_MODIFIED_SHARED_COLLECTION = 'apiLastModifiedSharedCollection',
  API_LAST_MODIFIED_CONFERENCE = 'apiLastModifiedConference',

  DELETE_OBJECT = 'deleteObject',

  DELETE_FILE = 'deleteFileWasabi',

  DELETE_FILE_COMMONS = 'deleteFileCommons'

}

export enum CollectionJobName {
  DELETE_COLLECTION = 'deleteCollection',
  DELETE_COLLECTION_NOTE = 'deleteCollectionNote',
  DELETE_COLLECTION_TODO = 'deleteCollectionTodo',
  DELETE_COLLECTION_EVENT = 'deleteCollectionEvent',
  DELETE_COLLECTION_CHILD_DATA = 'collectionDeleteChildDataQueue',
  DELETE_COLLECTION_MAIN_LOGIC = 'deleteCollection_mainLogic',
  CREATE_SYSTEM_KANBAN = 'createSystemKanbanOfCollection',
  DELETE_COLLECTION_TREE = 'deleteCollectionTree',
  DELETE_COLLECTION_MEMBER = 'deleteCollectionMember',
  DELETE_COLLECTION_CHANGE_CALENDAR_OBJECTS = 'deleteCollection_changeCalendarOfObjects'
}