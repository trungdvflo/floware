import { Injectable } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { MessagePartern } from '../common/constants/subscriber';
import { MessageQueueParam } from '../interface/microservice-subcriber.interface';
import { MessageFactory } from '../message/message.factory';
import { MessageService } from '../message/message.service';

@Injectable()
export class MessageSubscriber {
  constructor(private readonly messageService: MessageService) {}

  @MessagePattern(MessagePartern.MESSAGE)
  async handleMessage(@Payload() data: MessageQueueParam, @Ctx() context: RmqContext) {
    const message = MessageFactory.createFromSubscription(data);
    return await this.messageService.send(message);
  }
}
