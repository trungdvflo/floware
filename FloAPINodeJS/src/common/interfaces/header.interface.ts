export interface IHeader {
  appId: string;
  deviceUid: string;
  userAgent?: string;
}

export type HeaderAuth = {
  app_id: string;
  device_uid: string;
  authorization: string;
};