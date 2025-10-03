import { Injectable } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { MessagePartern } from '../common/constants/subscriber';
import { LoggerService } from '../common/logger/logger.service';
import { MessageChatParam } from '../interface/microservice-subcriber.interface';
import { ChatMessageService } from '../message/chat.message.service';
import { MessageFactory } from '../message/message.factory';

@Injectable()
export class ChatSubscriber {
  constructor(private readonly chatMessageService: ChatMessageService) {}

  @MessagePattern(MessagePartern.CHAT_MESSAGE)
  async handleMessage(@Payload() data: MessageChatParam, @Ctx() context: RmqContext) {
    try {
      const message = MessageFactory.createFromSubscriptionChat(data);
      return await this.chatMessageService.send(data?.from, message);
    } catch (err) {
      LoggerService.getInstance().logError(err.message);
      return null;
    }
  }
}
