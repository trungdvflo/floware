import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ChannelMember,
  ChimeCreateMessage,
  CreateChimeChannel,
  EventNames
} from '../events';

import { ChimeChatService } from '../services';
@Injectable()
export class ChimeListener {
  constructor(private readonly chimeService: ChimeChatService) { }

  @OnEvent(EventNames.CHATTING_CREATE_CHANNEL)
  async sendEventToIndividual({ headers, channels, user }:
    CreateChimeChannel) {
    await this.chimeService.setHeader(headers)
      .batchCreateChannel(channels, user);
  }

  @OnEvent(EventNames.CHATTING_GENERATE_MEMBER)
  async batchGenerateMember({ headers, members }:
    ChannelMember) {
    await this.chimeService.setHeader(headers)
      .batchGenerateMember(members);
  }

  @OnEvent(EventNames.CHATTING_CREATE_MEMBER)
  async batchCreateMember({ headers, members }:
    ChannelMember) {
    await this.chimeService.setHeader(headers)
      .batchCreateMember(members);
  }

  @OnEvent(EventNames.CHATTING_REMOVE_MEMBER)
  async batchRemoveMember({ headers, members }:
    ChannelMember) {
    await this.chimeService.setHeader(headers)
      .batchRemoveMember(members);
  }

  @OnEvent(EventNames.CHATTING_DELETE_CHANNEL)
  async batchDeleteChannel({ headers, channels, user }:
    CreateChimeChannel) {
    await this.chimeService.setHeader(headers)
      .batchDeleteChannel(channels, user);
  }

}