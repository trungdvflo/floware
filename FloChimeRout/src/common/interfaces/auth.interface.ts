export interface IReqUser {
  id: number;
  userId: number;
  email: string;
  appId: string;
  deviceUid: string;
  userAgent?: string;
  token: string;
}

export interface IReq {
  headers: HeaderAuth;
  user: IReqUser;
}

export type HeaderAuth = {
  app_id: string;
  device_uid: string;
  authorization: string;
};