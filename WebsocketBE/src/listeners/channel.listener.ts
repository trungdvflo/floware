import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AddChannelEvent,
  AddMemberToChannelEvent,
  EventName,
  RemoveChannelEvent,
  RemoveMemberToChannelEvent,
} from '../events/interface.event';
import { UserService } from '../user/user.service';

@Injectable()
export class ChannelEventListener {
  constructor(private userService: UserService) {}
  @OnEvent(EventName.CHANNEL_CREATE)
  async handleCreateChannelEvent(event: AddChannelEvent) {
    const { member } = event;
    for (const m of member) {
      const usage = await this.userService.userUsage(m);
      usage.increChannelCount(1);
      await usage.save();
    }
  }

  @OnEvent(EventName.CHANNEL_REMOVE)
  async handleRemoveChannelEvent(event: RemoveChannelEvent) {
    const { member } = event;
    for (const m of member) {
      const usage = await this.userService.userUsage(m);
      usage.reduceChannelCount(1);
      await usage.save();
    }
  }

  @OnEvent(EventName.CHANNEL_ADD_MEMBER)
  async handleAddMemberToChannelEvent(event: AddMemberToChannelEvent) {
    const { member } = event;
    for (const m of member) {
      const usage = await this.userService.userUsage(m);
      usage.increChannelCount(1);
      await usage.save();
    }
  }

  @OnEvent(EventName.CHANNEL_REMOVE_MEMBER)
  async handleRemoveMemberToChannelEvent(event: RemoveMemberToChannelEvent) {
    const { member } = event;
    for (const m of member) {
      const usage = await this.userService.userUsage(m);
      usage.reduceChannelCount(1);
      await usage.save();
    }
  }
}
