import { Inject, Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { AuthService } from '../../auth/auth.service';
import { LoggerService } from '../../common/logger/logger.service';
import { ApiAuthHeader } from '../../interface/api-auth-header.interface';
import { IMessage } from '../../interface/message.interface';
import { IUser, IUserSocketClient } from '../../interface/user.interface';
import { RedisCacheRepository } from '../../redis/repository/redis-cache.repository';

const oneDayInSeconds = 60 * 60 * 24;
const twoDayInseconds = oneDayInSeconds * 2;
const oneMinutes = 60;
export enum RedisPrefixEnum {
  USER = 'ws_user',
  SOCKET = 'ws_socket',
  USER_ROOM = 'ws_user_room',
  USER_ONLINE = 'ws_user_online',
  USERS_ONLINE = 'ws_users_online',
  USER_SEND = 'ws_user_send',
  MESSAGE = 'ws_message',
}

@Injectable()
export class WsService {
  constructor(
    @Inject(RedisCacheRepository)
    private readonly redisRepository: RedisCacheRepository,
    private authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  async verifyUser(client: Socket): Promise<IUser> {
    const authHeaderInfo: ApiAuthHeader = Object.assign(
      new ApiAuthHeader(),
      client.handshake?.query.token
    );
    return await this.authService.verify(authHeaderInfo);
  }

  async verifyUserAccess(token: string): Promise<IUser> {
    return await this.authService.verifyWsAccessToken(token);
  }

  async getUserSocketsFromCache(email: string): Promise<IUserSocketClient[] | null> {
    const userSockets = await this.redisRepository.get(RedisPrefixEnum.USER, email);
    if (userSockets) {
      return JSON.parse(userSockets);
    }
    return [];
  }

  async setUserSocketsToCache(email: string, userSockets: IUserSocketClient[]) {
    await this.redisRepository.setWithExpiry(
      RedisPrefixEnum.USER,
      email,
      JSON.stringify(userSockets),
      twoDayInseconds
    );
  }

  async addUserSocketToCache(userSocket: IUserSocketClient, email: string): Promise<void> {
    const currentUserSockets = await this.getUserSocketsFromCache(email);
    if (currentUserSockets && Array.isArray(currentUserSockets) && currentUserSockets.length) {
      currentUserSockets.push(userSocket);
      await this.setUserSocketsToCache(email, currentUserSockets);
    } else {
      await this.setUserSocketsToCache(email, [userSocket]);
    }
  }

  async removeUserSocketFromCache(userSocket: IUserSocketClient, email: string) {
    const currentUserSockets = await this.getUserSocketsFromCache(email);
    if (currentUserSockets) {
      const updatedUserSockets = currentUserSockets.filter(
        (socket) => socket.socketId !== userSocket.socketId
      );

      if (updatedUserSockets.length > 0) {
        await this.setUserSocketsToCache(email, updatedUserSockets);
      } else {
        await this.redisRepository.delete(RedisPrefixEnum.USER, email);
      }
    }
  }

  async getRoomsFromCache(email: string): Promise<string[] | null> {
    const rooms = await this.redisRepository.get(RedisPrefixEnum.USER_ROOM, email);
    if (rooms) {
      return JSON.parse(rooms);
    }
    return [];
  }

  async setListUserRoomToCache(email: string, rooms: string[]) {
    await this.redisRepository.setWithExpiry(
      RedisPrefixEnum.USER_ROOM,
      email,
      JSON.stringify(rooms),
      twoDayInseconds
    );
  }

  async addUserToRoomToCache(room: string, email: string): Promise<void> {
    const rooms = await this.getRoomsFromCache(email);
    if (rooms && Array.isArray(rooms) && rooms.length) {
      rooms.push(room);
      await this.setListUserRoomToCache(email, [...new Set(room)]);
    } else {
      await this.setListUserRoomToCache(email, [room]);
    }
  }

  async rmUserRoomFromCache(room: string, email: string) {
    const rooms = await this.getRoomsFromCache(email);
    if (rooms) {
      const updatedRooms = rooms.filter((id) => id !== room);
      if (updatedRooms.length > 0) {
        await this.setListUserRoomToCache(email, updatedRooms);
      } else {
        await this.redisRepository.delete(RedisPrefixEnum.USER_ROOM, email);
      }
    }
  }

  async rmAllRoomFromCache(email: string) {
    await this.redisRepository.delete(RedisPrefixEnum.USER_ROOM, email);
  }

  async isOnlineStatus(email: string): Promise<boolean> {
    const online = await this.redisRepository.get(RedisPrefixEnum.USER_ONLINE, email);
    return online === '1';
  }

  async setOnlineStatus(email: string) {
    await this.redisRepository.setWithExpiry(
      RedisPrefixEnum.USER_ONLINE,
      email,
      '1',
      twoDayInseconds
    );
    const listOnlines = await this.redisRepository.smember(RedisPrefixEnum.USERS_ONLINE, '');
    listOnlines.push(email);
    await this.redisRepository.sadd(RedisPrefixEnum.USERS_ONLINE, '', [...new Set(listOnlines)]);
  }

  async setOfflineStatus(email: string) {
    await this.redisRepository.delete(RedisPrefixEnum.USER_ONLINE, email);
    await this.redisRepository.srem(RedisPrefixEnum.USERS_ONLINE, '', [email]);
    await this.redisRepository.delete(RedisPrefixEnum.USER, email);
  }

  async registerUsersSend(messsageUid: string, emails: string[]) {
    await Promise.all(
      emails.map(async (email) => {
        try {
          await this.redisRepository.setWithExpiry(
            RedisPrefixEnum.USER_SEND,
            email + '::' + messsageUid,
            messsageUid,
            this.configService.get('app.ws_expired_cache_messsag', 60)
          );
        } catch (error) {
          LoggerService.getInstance().logError(error);
        }
      })
    );
  }

  async removeLogUserSend(messsageUid: string, email: string) {
    await this.redisRepository.delete(RedisPrefixEnum.USER_SEND, email + '::' + messsageUid);
  }
  async getUsersOnline() {
    return [...new Set(await this.redisRepository.smember(RedisPrefixEnum.USERS_ONLINE, ''))];
  }

  async getMessageNotSendByUser(email: string) {
    const partern = RedisPrefixEnum.USER_SEND + ':' + email + '::*';
    const keys = await this.redisRepository.getKeys(partern);
    const messageUids = new Set<string>();
    for (const key of keys) {
      const val = await this.redisRepository.getdel(key);
      if (val) {
        messageUids.add(val);
      }
    }
    return [...messageUids];
  }

  async cacheMessage(messsage: IMessage) {
    await this.redisRepository.setWithExpiry(
      RedisPrefixEnum.MESSAGE,
      messsage.payload.message_uid,
      JSON.stringify(messsage),
      this.configService.get('app.ws_expired_cache_messsag', 60)
    );
  }

  async getCacheMessage(message_uid: string) {
    const message = await this.redisRepository.get(RedisPrefixEnum.MESSAGE, message_uid);
    if (!message) {
      return null;
    }
    return JSON.parse(message) as IMessage;
  }
}
