
export interface IUserProcess {
  user_id: number;
  username: string;
  id?: number;
  objScanned?: number;
  emailScanned?: number;
  objScanning?: number;
  emailScanning?: number;
}
export type IEmailDeletion = {
  email: string;
  uid: number;
  path: string;
};
export type IEmailObject = {
  object_uid: Buffer;
};

export type IObjectInvalid = {
  user_id: number;
  id?: number;
  object_type?: Buffer;
  object_uid?: Buffer;
  link_type?: string;
  link_id?: number;
  uid?: number;
  path?: string;
};

export type IEmailCollector = {
  user_id?: number
  object_uid?: Buffer;
  email?: string;
  total?: number;
};

export type ICollectObject4User = {
  nCount: number;
  nRO: number;
  nCH: number;
  nKC: number;
  nLCO: number;
  nLO: number;
  nTC: number;
  nSO: number;
  nKB: number;
  nCIM: number;
  nFIL: number;
  nMaxTurn: number;
};

export type IOutdatedNotification = {
  id: number;
  user_id: number;
};