import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { instrument } from '@socket.io/admin-ui';
import { Server, Socket } from 'socket.io';
import { WS_CURRENT_USER_CHANNEL_PREFIX } from '../common/constants/system.constant';
import { LoggerService } from '../common/logger/logger.service';
import { getUTCSeconds } from '../common/utils/common';
import {
  EventName,
  WsChangeRoom,
  WsClientAckEvent,
  WsClientConnectedEvent,
  WsClientDisConnectedEvent,
  WsClientMessageEvent,
} from '../events/interface.event';
import { IUser } from '../interface/user.interface';
import { WsService } from './service/websocket.service';

export enum EventType {
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  CLIENT_SEND_MESSAGE = 'CLIENT_SEND_MESSAGE',
  USER_OFFLINE = 'USER_OFFLINE',
  USER_ONLINE = 'USER_ONLINE',
}

export const BROADCAST_CHANNEL = 'BROAD_CAST_CHANNEL';
export interface Handle {
  eventType: EventType;
  handle(client: Socket, user: IUser): any;
}

export interface WSMessage {
  ignoreUser?: string;
  event: string;
  content: string;
}

@WebSocketGateway()
@Injectable()
export class WebsocketGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(WebsocketGateway.name);
  constructor(private eventEmitter: EventEmitter2, private wsService: WsService) { }

  @WebSocketServer() io: Server;

  afterInit() {
    this.logger.log('Initialized');

    if (process.env?.REALTIME_ADMIN_ALLOW === 'true') {
      instrument(this.io, {
        auth: {
          type: 'basic',
          username: process.env?.REALTIME_ADMIN_UI_USER || 'admin',
          password: process.env?.REALTIME_ADMIN_UI_PASS || '',
        },
        mode: 'development',
      });
    }

    // set middleware for verify authenticate
    this.io.use(async (socket, next) => {
      try {
        const authorization =
          socket.handshake.auth?.token ||
          socket.handshake.headers?.token ||
          socket.handshake.query?.token;
        if (!authorization) {
          throw new UnauthorizedException('Unauthorized');
        }
        const user: IUser = await this.wsService.verifyUserAccess(authorization);
        socket.data.user = user;
      } catch (err) {
        return next(err);
      }
      return next();
    });

    this.io.of("/admin").use(async (socket, next) => {
      try {
        const allowedHost = process.env?.REALTIME_ADMIN_HOST_ALLOW;
        if (allowedHost && socket.handshake.headers.origin !== allowedHost) {
          throw new UnauthorizedException('Unauthorized');
        }
      } catch (err) {
        return next(err);
      }
      return next();
    });
  }

  buildUserChannel = (email: string) => {
    return WS_CURRENT_USER_CHANNEL_PREFIX + email;
  }
  async getUserSockets(email: string) {
    return await this.wsService.getUserSocketsFromCache(email);
  }
  async isOnlineStatusFromCache(email: string) {
    return await this.wsService.isOnlineStatus(email);
  }

  async getUsersOnlineFromCache(emails?: string[]) {
    if (!emails) {
      return await this.wsService.getUsersOnline();
    }

    const users = [];
    for (const email of emails) {
      if (await this.isOnlineStatusFromCache(email)) {
        users.push(email);
      }
    }
    return users;
  }

  async isUserOffline(email: string) {
    const userChannel = WS_CURRENT_USER_CHANNEL_PREFIX + email;
    try {
      const sockets = await this.io.in(userChannel).fetchSockets();
      return sockets.length === 0;
    } catch (err) {
      LoggerService.getInstance().logError(`check user offline error ${err}`);
    }
    try {
      const sockets = await this.io.local.in(userChannel).fetchSockets();
      return sockets.length === 0;
    } catch (err) {
      LoggerService.getInstance().logError(`check user offline error ${err}`);
      return true;
    }
  }

  async joinChannel(channel: string, email: string) {
    const userChannel = WS_CURRENT_USER_CHANNEL_PREFIX + email;
    this.io.in(userChannel).socketsJoin(channel);
    this.eventEmitter.emit(EventName.WS_JOIN_ROOM, { room: channel, email } as WsChangeRoom);
  }

  async leaveChannel(channel: string, email: string) {
    const userChannel = WS_CURRENT_USER_CHANNEL_PREFIX + email;
    this.logger.debug(userChannel + ' leave channel ' + channel);
    this.io.in(userChannel).socketsLeave(channel);
    this.eventEmitter.emit(EventName.WS_LEAVE_ROOM, { room: channel, email } as WsChangeRoom);
  }

  async leaveAllFromChannel(channel: string) {
    this.io.socketsLeave(channel);
    this.logger.debug('All user leave channel ' + channel);
  }

  async sendToChannel(channel: string, message: WSMessage, option: any) {
    try {
      if (channel) {
        let targetChannel = this.io.sockets.in(channel);
        if (message?.ignoreUser) {
          const userChannel = this.buildUserChannel(message.ignoreUser);
          targetChannel = targetChannel.except(userChannel);
        }

        if (option.delay > 0) {
          setTimeout(() => {
            targetChannel.emit(message.event, message.content);
          }, option.delay);
          return true;
        }
        return targetChannel.emit(message.event, message.content);
      }
    } catch (err) {
      LoggerService.getInstance().logError(`error_send ${err}`);
      return false;
    }
    return false;
  }

  async broadcast(message: WSMessage, option: any) {
    return await this.sendToChannel(BROADCAST_CHANNEL, message, option);
  }

  async sendToUser(email: string, message: WSMessage, option: any) {
    const userChannel = WS_CURRENT_USER_CHANNEL_PREFIX + email;
    if (await this.isOnlineStatusFromCache(email)) {
      return await this.sendToChannel(userChannel, message, option);
    }
    return false;
  }

  async handleConnection(client: Socket) {
    this.logger.log(`Client id: ${client.id} connected`);
    const currentTime = getUTCSeconds();
    this.eventEmitter.emit(EventName.WS_CLIENT_CONNECTED, {
      client,
      timestamp: currentTime,
    } as WsClientConnectedEvent);
    const { sockets } = this.io.sockets;
    if (client.recovered) {
      this.logger.debug(`Client : ${client.id} is recovered connection.`);
    }
    this.logger.debug(`Number of connected clients: ${sockets.size}`);
    // const isOfflineBefore = !await this.wsService.isOnlineStatus(client.data.user.email)
    // if (isOfflineBefore) {
    LoggerService.getInstance().logInfo(`User ${client?.data?.user?.email} online!`);
    this.eventEmitter.emit(EventName.WS_CLIENT_ONLINE, {
      client,
      timestamp: currentTime,
    } as WsClientConnectedEvent);
    // }
    const logger = this.logger;
    client.on('disconnect', (reason) => {
      logger.debug(`Client : ${client.id} is disconnected with reason: ${reason}.`);
    });
  }

  async handleDisconnect(client: Socket) {
    this.logger.debug(`Disconnected user ${client?.data?.user?.email}, client ${client.id}`);
    const currentTime = getUTCSeconds();
    setTimeout(async () => {
      try {
        const isUserOffline = await this.isUserOffline(client.data.user.email);
        if (isUserOffline) {
          this.logger.debug(`User ${client?.data?.user?.email} offline!`);
          this.eventEmitter.emit(EventName.WS_CLIENT_OFFLINE, {
            client,
            timestamp: currentTime,
          } as WsClientDisConnectedEvent);
        }
      } catch (err) {
        LoggerService.getInstance().logError(err);
      }
    }, 2000);
    this.eventEmitter.emit(EventName.WS_CLIENT_DISCONNECTED, {
      client,
      timestamp: currentTime,
    } as WsClientDisConnectedEvent);
  }

  @SubscribeMessage('client_message')
  handleClientMessage(client: Socket, data: any) {
    this.logger.log(`Message received from client id: ${client.id}`);
    this.eventEmitter.emit(EventName.WS_CLIENT_MSG, {
      client,
      data,
      timestamp: getUTCSeconds(),
    } as WsClientMessageEvent);
    return null;
  }

  @SubscribeMessage('client_ack')
  handleClientAck(client: Socket, data: any) {
    if (!data?.message_uid) {
      return null;
    }

    this.eventEmitter.emit(EventName.WS_CLIENT_ACK, {
      clientId: client.id,
      user: client.data.user.email,
      messageUid: data.message_uid,
      timestamp: getUTCSeconds(),
    } as WsClientAckEvent);
  }
}
