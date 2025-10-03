export const GetRequestParam = {
  object_time_sync: {
    description: 'Last get change time follow UTC standing: exp: 1566464330.816'
  },
  object_type: {
    description: 'Can be either:\
    VTODO,\
    URL,\
    FILE,\
    KANBAN,\
    CANVAS'
  },
  id: { description: 'Unique ID' }
};

export const ApiOperationInfo = {
  get: {
    summary: 'Get object orders list',
  },
  put: {
    summary: 'Change object orders list',
  },
  reset: {
    summary: 'Reset orders all items',
  }
};