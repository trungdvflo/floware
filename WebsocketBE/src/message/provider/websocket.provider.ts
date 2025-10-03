import { Injectable } from '@nestjs/common';
import { isEmail } from 'class-validator';
import { LoggerService } from '../../common/logger/logger.service';
import { IChatMessage, IMessage } from '../../interface/message.interface';
import { IMessageProvider } from '../../interface/message.provider.interface';
import { WebsocketGateway } from '../../websocket/websocket.gateway';
@Injectable()
export class WebsocketMessageProvider implements IMessageProvider {
  constructor(private readonly ws: WebsocketGateway) { }

  async isUserOffline(email?: string) {
    return !(await this.ws.isOnlineStatusFromCache(email));
  }

  async getUsersOnlineFromCache() {
    return await this.ws.getUsersOnlineFromCache();
  }

  async getUserSockets(email: string) {
    return await this.ws.getUserSockets(email);
  }

  async addUserToChannel(email: string, channel: string) {
    return await this.ws.joinChannel(channel, email);
  }

  async rmUserFromChannel(email: string, channel: string) {
    return await this.ws.leaveChannel(channel, email);
  }

  async rmAllUserFromChannel(channel: string) {
    return await this.ws.leaveAllFromChannel(channel);
  }

  async send(to: string[], message: IMessage): Promise<any> {
    try {
      if (message.isNeedAck()) {
        message.header.isNeedAck = true;
      }
      const that = this;
      return Promise.all(
        to.map(async (channel: string) => {
          message.payload.channel = channel;
          const messageNeedToSend = {
            ...message,
            ignoreDeviceTokens: undefined,
            ignoreDevices: undefined,
            header: {
              ...message.header,
              to: undefined
            }
          };

          return {
            channel,
            message_uid: message.payload.message_uid,
            status: await that.ws.sendToChannel(
              channel,
              {
                event: message.header.event_type,
                content: JSON.stringify(messageNeedToSend),
                ignoreUser: message.isNotSendSelf()
                && isEmail(message.header.from) ? message.header.from : null,
              },
              message.option
            ),
          };
        })
      );
    } catch (err) {
      LoggerService.getInstance().logError(err);
      return [];
    }
  }

  async sendChat(to: string[], message: IChatMessage): Promise<any> {
    try {
      if (message.isNeedAck()) {
        message.header.isNeedAck = true;
      }
      const that = this;

      const { channel: ignoreChanel, ...payload } = message.payload;
      const enhancedMessage = {
        ...message,
        ignoreDeviceTokens: undefined,
        ignoreDevices: undefined,
        payload,
        header: {
          ...message.header,
          to: undefined
        }
      };

      return Promise.all(
        to.map(async (channel: string) => {
          return {
            channel,
            message_uid: message.payload.message_uid,
            status: await that.ws.sendToChannel(
              channel,
              {
                event: message.header.event_type,
                content: JSON.stringify(enhancedMessage),
                ignoreUser: message.isNotSendSelf()
                && isEmail(message.header.from) ? message.header.from : null,
              },
              message.option
            ),
            parent_uid: message.payload.parent_uid,
            content_marked: message.payload.content_marked,
            message_marked: message.payload.message_marked,
          };
        })
      );
    } catch (err) {
      LoggerService.getInstance().logError(err);
      return [];
    }
  }
}
