export * from './real-time.interface';

export type HeaderAuth = {
  app_id: string;
  device_uid: string;
  authorization: string;
};

export interface EmailDTO {
  email: string;
}

export interface IUser {
  userId: number;
  id: number;
  email: string;
  appId: string;
  deviceUid: string;
  userAgent: string;
  token: string;
}
