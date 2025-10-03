import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { APP_IDS, FixedChannel, WS_CURRENT_USER_CHANNEL_PREFIX } from '../common/constants';
import { LoggerService } from '../common/logger/logger.service';
import { getUTCSeconds } from '../common/utils/common';
import { MessageUserStatusRepository } from '../database/repositories';
import { ChannelRepository } from '../database/repositories/channel.reposotory';
import {
  ChannelUserTypingEvent,
  EventName,
  WsChangeRoom,
  WsClientConnectedEvent,
  WsClientDisConnectedEvent,
  WsClientMessageEvent,
} from '../events/interface.event';
import { MessageCode } from '../interface/message.interface';
import { IUser, IUserSocketClient } from '../interface/user.interface';
import { ChatMessageService } from '../message/chat.message.service';
import { MessageFactory } from '../message/message.factory';
import { MessageService } from '../message/message.service';
import { SettingService } from '../setting/setting.service';
import { WsService } from '../websocket/service/websocket.service';
import { BROADCAST_CHANNEL } from '../websocket/websocket.gateway';

@Injectable()
export class ClientEventListener {
  constructor(
    private channelRep: ChannelRepository,
    private messageService: MessageService,
    private chatService: ChatMessageService,
    private wsService: WsService,
    private readonly messageUserStatusReq: MessageUserStatusRepository,
    private readonly settingService: SettingService
  ) {}

  getFlatForm(appId: string) {
    switch (appId) {
      case APP_IDS.web:
        return FixedChannel.WEB;
      case APP_IDS.mac:
        return FixedChannel.MAC;
      case APP_IDS.iphone:
        return FixedChannel.IPHONE;
      case APP_IDS.ipad:
        return FixedChannel.IPAD;
      case APP_IDS.sabreDav:
        return FixedChannel.SABRE_DAV;
      case APP_IDS.macInternal:
        return FixedChannel.MAC_INTERNAL;
      default:
        return 'unknown';
    }
  }
  @OnEvent(EventName.WS_CLIENT_CONNECTED)
  async clientJoinChannel(event: WsClientConnectedEvent) {
    const { client } = event;
    const user = client?.data?.user;
    const channels = [];
    switch (user.appId) {
      case APP_IDS.web:
        client.join(FixedChannel.WEB);
        channels.push(FixedChannel.WEB);
        LoggerService.getInstance().logInfo(
          `Client user ${user.email} joined to channel ${FixedChannel.WEB}`
        );
        break;
      case APP_IDS.mac:
        client.join(FixedChannel.MAC);
        channels.push(FixedChannel.MAC);
        LoggerService.getInstance().logInfo(
          `Client user ${user.email} joined to channel ${FixedChannel.MAC}`
        );
        break;
      case APP_IDS.iphone:
        client.join(FixedChannel.IPHONE);
        channels.push(FixedChannel.IPHONE);
        LoggerService.getInstance().logInfo(
          `Client user ${user.email} joined to channel ${FixedChannel.IPHONE}`
        );
        break;
      case APP_IDS.ipad:
        client.join(FixedChannel.IPAD);
        channels.push(FixedChannel.IPAD);
        LoggerService.getInstance().logInfo(
          `Client user ${user.email} joined to channel ${FixedChannel.IPAD}`
        );
        break;
      case APP_IDS.sabreDav:
        client.join(FixedChannel.SABRE_DAV);
        channels.push(FixedChannel.SABRE_DAV);
        LoggerService.getInstance().logInfo(
          `Client user ${user.email} joined to channel  ${FixedChannel.SABRE_DAV}`
        );
        break;
      case APP_IDS.macInternal:
        client.join(FixedChannel.MAC_INTERNAL);
        channels.push(FixedChannel.MAC_INTERNAL);
        LoggerService.getInstance().logInfo(
          `Client user ${user.email} joined to channel  ${FixedChannel.MAC_INTERNAL}`
        );
        break;
    }
    let dynamicChannels = []; // await this.wsService.getRoomsFromCache(user.email)
    if (dynamicChannels.length <= 0) {
      const dbChannels = await this.channelRep.getChannelByEmail(user.email);
      dynamicChannels = dbChannels.map((channel) => {
        return channel.name;
      });
      if (dynamicChannels.length > 0) {
        await this.wsService.setListUserRoomToCache(user.email, dynamicChannels);
      }
    }
    if (dynamicChannels) {
      for (const channel of dynamicChannels) {
        channels.push(channel);
        client.join(channel);
      }
    }
    // join to current user channel
    const userChannel = WS_CURRENT_USER_CHANNEL_PREFIX + user.email;
    client.join(userChannel);
    // join to broadcast channel
    client.join(BROADCAST_CHANNEL);

    channels.push(userChannel);
    channels.push(BROADCAST_CHANNEL);

    const helloMessage = JSON.stringify({
      header: { event_type: 'SESSION_ESTABLISHED', message_type: 'SYSTEM' },
      payload: { channels },
    });
    client.emit('HELLO', helloMessage);
  }

  @OnEvent(EventName.WS_CLIENT_CONNECTED)
  async userResent(event: WsClientConnectedEvent) {
    const { client } = event;
    const user = client?.data?.user;
    const messageUnsents = await this.messageUserStatusReq.getMessageUnsent(user.email);

    for (const message of messageUnsents) {
      const m = MessageFactory.createFromDb(message);
      const content = JSON.stringify(m);
      client.emit(message.type, content);
    }
    if (messageUnsents.length > 0) {
      await this.messageUserStatusReq.delete({
        email: user.email,
      });
    }
  }

  @OnEvent(EventName.WS_CLIENT_CONNECTED)
  async updateCache(event: WsClientConnectedEvent) {
    const { client } = event;
    const user = client?.data?.user as IUser;
    const userSocket = {
      socketId: client.id,
      deviceUid: user.deviceUid,
      appId: user.appId,
      platform: this.getFlatForm(user.appId),
      lastConnected: getUTCSeconds(),
    } as IUserSocketClient;
    await this.wsService.addUserSocketToCache(userSocket, user.email);
  }

  @OnEvent(EventName.WS_CLIENT_DISCONNECTED)
  async removeCache(event: WsClientDisConnectedEvent) {
    const { client } = event;
    const user = client?.data?.user as IUser;
    const userSocket = {
      socketId: client.id,
      deviceUid: user.deviceUid,
      appId: user.appId,
      platform: this.getFlatForm(user.appId),
      lastConnected: getUTCSeconds(),
    } as IUserSocketClient;
    await this.wsService.removeUserSocketFromCache(userSocket, user.email);
  }

  @OnEvent(EventName.WS_CLIENT_MSG)
  async handleWSClientSendEvent(event: WsClientMessageEvent) {
    const data = this.parseDataFromClient(event);

    if (data === null) {
      return;
    }

    const user = event?.client?.data?.user;
    if (user === null) {
      return;
    }

    const { message_code, channel, email } = data;
    const userSetting = await this.settingService.loadChannelSetting(user.email, channel);
    if (!userSetting.isTurnOnChatTyping()) {
      return;
    }
    await this.chatService.isExistChannelOrThrowException(channel, email);
    switch (message_code) {
      case MessageCode.CHAT_USER_TYPING:
        await this.messageService.send(
          MessageFactory.createMessageEventUserTyping({
            email,
            channel,
            isTyping: true,
          } as ChannelUserTypingEvent)
        );
        break;
      case MessageCode.CHAT_USER_END_TYPING:
        await this.messageService.send(
          MessageFactory.createMessageEventUserTyping({
            email,
            channel,
            isTyping: false,
          } as ChannelUserTypingEvent)
        );
        break;
    }
  }

  parseDataFromClient(event: WsClientMessageEvent) {
    if (event?.data?.message_code && event?.data?.channel && event?.client?.data?.user?.email) {
      return {
        message_code: event?.data?.message_code,
        channel: event?.data?.channel,
        email: event?.client?.data?.user?.email,
      };
    }

    if (!Array.isArray(event?.data)) {
      return null;
    }

    if (event?.data.length === 0) {
      return null;
    }
    if (
      event?.data[0]?.message_code &&
      event?.data[0]?.channel &&
      event?.client?.data?.user?.email
    ) {
      return {
        message_code: event?.data[0]?.message_code,
        channel: event?.data[0]?.channel,
        email: event?.client?.data?.user?.email,
      };
    }
    return null;
  }

  @OnEvent(EventName.WS_JOIN_ROOM)
  async addUserToRoomToCache(event: WsChangeRoom) {
    const { email, room } = event;
    await this.wsService.addUserToRoomToCache(room, email);
  }

  @OnEvent(EventName.WS_LEAVE_ROOM)
  async removeUserFromRoomFromCache(event: WsChangeRoom) {
    const { email, room } = event;
    await this.wsService.rmUserRoomFromCache(room, email);
  }
}
