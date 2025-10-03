import { Injectable } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';
import { CreateChannelParam } from '../channel/channel-param.request';
import { ChannelService } from '../channel/channel.service';
import { MessagePartern } from '../common/constants/subscriber';

@Injectable()
export class ChannelSubscriber {
  constructor(private readonly channelService: ChannelService) {}

  @MessagePattern(MessagePartern.CHANNEL_CREATE)
  async addChannel(@Payload() data: CreateChannelParam, @Ctx() context: RmqContext) {
    return this.channelService.createChannel(data);
  }

  @MessagePattern(MessagePartern.CHANNEL_ADD_MEMBER)
  async addChannelMember(@Payload() data: CreateChannelParam, @Ctx() context: RmqContext) {
    return this.channelService.addChannelMember(data.members, data.name);
  }

  @MessagePattern(MessagePartern.CHANNEL_REMOVE_MEMBER)
  async deleteChannelMembers(@Payload() data: CreateChannelParam, @Ctx() context: RmqContext) {
    return this.channelService.deleteChannelMember(data.members, data.name);
  }

  @MessagePattern(MessagePartern.CHANNEL_REMOVE)
  async deleteChannel(@Payload() channelName: string, @Ctx() context: RmqContext) {
    return this.channelService.deleteChannel(channelName);
  }
}
