export const THIRD_PARTY_ACCOUNT = {
  WORKER_DELETE: 'DELETE_3rd',
  WORKER_JOBS: [
    'LINKED_COLLECTION_OBJECT',
    'LINKED_OBJECT',
    'SORT_OBJECT',
    'CONTACT_HISTORY',
    'EMAIL_TRACKING',
    'CANVAS',
    'RECENT_OBJ'
  ]
};
export enum ACCOUNT_TYPE {
  Google = 1, Yahoo = 2,
  OtherEmail = 3, OtherCaldav = 4,
  iCloud = 5, OtherAccount = 7,
  MS356 = 8
}

export enum AUTH_TYPE {
  OTHER_AUTH_TYPE = 0,
  YAHOO_AUTH_TYPE = 0,
  GMAIL_AUTH_TYPE = 256,
  MS365_AUTH_TYPE = 256,
  ICLOUD_AUTH_TYPE = 0
}

export enum USE_SSL {
  NOT_USE = 0,
  USE = 1
}
