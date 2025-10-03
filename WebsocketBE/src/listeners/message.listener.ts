import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LoggerService } from '../common/logger/logger.service';
import {
  EventName,
  MesageBeforeSend,
  WsClientAckEvent,
  WsClientConnectedEvent,
} from '../events/interface.event';
import { IMessage } from '../interface/message.interface';
import { WsService } from '../websocket/service/websocket.service';
@Injectable()
export class MessageEventListener {
  constructor(private wsService: WsService) {}
  @OnEvent(EventName.MESSAGE_BEFORE_SEND)
  async beforeSendMessage(event: MesageBeforeSend) {
    const { message, to_actual_user } = event;
    if (message.isNeedAck()) {
      await this.wsService.cacheMessage(message);
      await this.wsService.registerUsersSend(message.payload.message_uid, to_actual_user);
    }
  }

  @OnEvent(EventName.WS_CLIENT_CONNECTED)
  async sendMessageUnsent(event: WsClientConnectedEvent) {
    const { client } = event;
    const user = client?.data?.user;
    const messageUnsents = await this.wsService.getMessageNotSendByUser(user.email);
    const messages = [];
    for (const messageUid of messageUnsents) {
      const message = await this.wsService.getCacheMessage(messageUid);
      if (message) {
        messages.push(message);
      }
    }

    if (messages.length <= 0) {
      return;
    }

    const oderMessageAsc = (messageOne: IMessage, messageTwo: IMessage) => {
      if (messageOne.header.time > messageTwo.header.time) {
        return 1;
      }
      if (messageOne.header.time < messageTwo.header.time) {
        return -1;
      }
      return 0;
    };

    const oderedMessages: IMessage[] = messages.sort(oderMessageAsc);
    for (const m of oderedMessages) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      m.header.recovery = true;
      client.emit(m.header.event_type, JSON.stringify(m));
    }
  }

  @OnEvent(EventName.WS_CLIENT_ACK)
  async handleWSClientAckEvent(event: WsClientAckEvent) {
    const { user, clientId, messageUid } = event;
    LoggerService.getInstance().logInfo('remove cache when receive ack from client ' + clientId);
    await this.wsService.removeLogUserSend(messageUid, user);
  }
}
