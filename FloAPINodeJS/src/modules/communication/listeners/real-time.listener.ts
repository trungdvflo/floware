import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  AddMemberToChannel,
  CreateChannel,
  DeleteChannel,
  EventNames,
  EventToChannel,
  EventToIndividual,
  RemoveMemberFromChannel
} from '../events';
import { RealTimeService } from '../services';
import { Listener } from './listener';

@Injectable()
export class RealtimeListener extends Listener {
  constructor(private readonly realTimeService: RealTimeService) {
    super();
  }

  // send real-time message individual
  @OnEvent(EventNames.SYS_EVENT_TO_INDIVIDUAL)
  async sendSystemEventToIndividual({ email, message_code,
    content, metadata, persistence, send_offline }:
    EventToIndividual) {
    await this.realTimeService
      .sendSystemEventToIndividual(email, message_code,
        content, metadata, persistence, send_offline);
  }

  // send real-time message for shared collection
  @OnEvent(EventNames.SYS_EVENT_TO_CHANNEL)
  async sendSystemEventToChannel({ channelId, message_code,
    content, metadata, type, persistence, send_offline }:
    EventToChannel) {
    await this.realTimeService
      .sendSystemEventToChannel(channelId, message_code,
        content, metadata, type, persistence, send_offline);
  }

  // send real-time message individual
  @OnEvent(EventNames.SYS_NOTIFICATION_TO_INDIVIDUAL)
  async sendSystemNotificationToIndividual({ email, message_code,
    content, metadata, persistence, send_offline }:
    EventToIndividual) {
    await this.realTimeService
      .sendSystemNotificationToIndividual(email, message_code,
        content, metadata, persistence, send_offline);
  }

  // send real-time message for shared collection
  @OnEvent(EventNames.SYS_NOTIFICATION_TO_CHANNEL)
  async sendSystemNotificationToChannel({ channelId, message_code,
    content, metadata, type, persistence, send_offline }:
    EventToChannel) {
    await this.realTimeService
      .sendSystemNotificationToChannel(channelId, message_code,
        content, metadata, type, persistence, send_offline);
  }

  // send real-time message individual
  @OnEvent(EventNames.EVENT_TO_INDIVIDUAL)
  async sendEventToIndividual({ headers, email, message_code,
    content, metadata, persistence, send_offline }:
    EventToIndividual) {
    await this.realTimeService.setHeader(headers)
      .sendEventToIndividual(email, message_code,
        content, metadata, persistence, send_offline);
  }

  // send real-time message for shared collection
  @OnEvent(EventNames.EVENT_TO_CHANNEL)
  async sendEventToChannel({ headers, channelId, message_code,
    content, metadata, type, persistence, send_offline }:
    EventToChannel) {
    await this.realTimeService.setHeader(headers)
      .sendEventToChannel(channelId, message_code,
        content, metadata, type, persistence, send_offline);
  }

  // send real-time message individual
  @OnEvent(EventNames.NOTIFICATION_TO_INDIVIDUAL)
  async sendNotificationToIndividual({ headers, email, message_code,
    content, metadata, persistence, send_offline }:
    EventToIndividual) {
    await this.realTimeService.setHeader(headers)
      .sendNotificationToIndividual(email, message_code,
        content, metadata, persistence, send_offline);
  }

  // send real-time message for shared collection
  @OnEvent(EventNames.NOTIFICATION_TO_CHANNEL)
  async sendNotificationToChannel({ headers, channelId, message_code,
    content, metadata, type, persistence, send_offline }:
    EventToChannel) {
    await this.realTimeService.setHeader(headers)
      .sendNotificationToChannel(channelId, message_code,
        content, metadata, type, persistence, send_offline);
  }

  // create real-time channel for shared collection
  @OnEvent(EventNames.CREATE_REALTIME_CHANNEL)
  async createRealtimeChannel({
    headers, channelId, members, type, title
  }: CreateChannel) {
    let retryCount: number = 0;
    const retryMax = 3;
    const retryDelay = 100;

    const createChannel = async () => {
      const { data, error } = await this.realTimeService.setHeader(headers)
        .createChannel(channelId, title, type, members);
      if (!data?.channel?.name) {
        if (retryCount < retryMax) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          return await createChannel();
        } else {
          return error;
        }
      }
      return data;
    };

    return await createChannel();
  }
  // leave real-time channel for shared collection
  @OnEvent(EventNames.REMOVE_MEMBER_FROM_CHANNEL)
  async removeMember({ headers, channelId, members, type }:
    RemoveMemberFromChannel) {
    await this.realTimeService.setHeader(headers)
      .removeMemberFromChannel(channelId, members, type);
  }

  // join real-time channel for shared collection
  @OnEvent(EventNames.ADD_MEMBER_TO_CHANNEL)
  async addMember({ headers, channelId, members, type }:
    AddMemberToChannel) {
    await this.realTimeService.setHeader(headers)
      .addMemberToChannel(channelId, members, type);
  }
  // Delete real-time channel
  @OnEvent(EventNames.DELETE_REALTIME_CHANNEL)
  async deleteRealtimeChannel({ headers, channelId, type }: DeleteChannel) {
    await this.realTimeService.setHeader(headers)
      .deleteChannel(channelId, type);
  }
}