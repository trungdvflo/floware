import { IsOptional, IsString } from 'class-validator';

export interface IUser {
  userId: number;
  email: string;
  appId: string;
  deviceUid: string;
  userAgent: string;
  token: string;
}

export interface IUserSocketClient {
  socketId: string;
  userId: number;
  appId: string;
  deviceUid: string;
  userAgent: string;
  platform: string;
  lastConnected: number;
}

export class UserOnlineQuerySearch {
  @IsOptional()
  @IsString()
  channel: string;
}
