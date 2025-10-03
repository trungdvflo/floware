import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateChannelParam } from '../channel/channel-param.request';
import { ClientName, MessagePartern } from '../common/constants/subscriber';
import { MessageChatParam, MessageQueueParam } from '../interface/microservice-subcriber.interface';

@Injectable()
export class MicroserviceProducerService {
  constructor(@Inject(ClientName.RMQ_REALTIME_MODULE) private readonly client: ClientProxy) {}

  public sendMsg(data: MessageQueueParam) {
    return this.send(MessagePartern.MESSAGE, data);
  }

  public sendCreateChannelMsg(data: CreateChannelParam) {
    return this.send(MessagePartern.CHANNEL_CREATE, data);
  }

  public sendRemoveChannelMsg(channel: string) {
    return this.send(MessagePartern.CHANNEL_REMOVE, channel);
  }

  public sendChannelAddMemberMsg(data: CreateChannelParam) {
    return this.send(MessagePartern.CHANNEL_ADD_MEMBER, data);
  }

  public sendChannelRemoveMemberMsg(data: CreateChannelParam) {
    return this.send(MessagePartern.CHANNEL_REMOVE_MEMBER, data);
  }

  public sendChatMessage(data: MessageChatParam) {
    return this.send(MessagePartern.CHAT_MESSAGE, data);
  }

  public send(pattern: string, data: any) {
    return this.client.send(pattern, data);
  }
}
