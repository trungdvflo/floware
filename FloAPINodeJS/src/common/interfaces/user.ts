import { HeaderAuth } from "./header.interface";

export interface IUser {
  userId: number;
  id: number;
  email: string;
  appId: string;
  deviceUid: string;
  userAgent: string;
  token: string;
}

export interface IReq {
  headers: HeaderAuth;
  user: IUser;
}