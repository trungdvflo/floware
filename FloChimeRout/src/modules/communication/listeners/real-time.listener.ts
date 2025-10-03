/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ADD_MEMBER_TO_CHANNEL,
  AddMemberToChannel,
  CREATE_REALTIME_CHANNEL,
  CreateChannel,
  DELETE_REALTIME_CHANNEL,
  DeleteChannel,
  EVENT_TO_CHANNEL,
  EVENT_TO_INDIVIDUAL,
  EventToChannel,
  EventToIndividual,
  NOTIFICATION_TO_CHANNEL,
  NOTIFICATION_TO_INDIVIDUAL,
  REMOVE_MEMBER_FROM_CHANNEL,
  RemoveMemberFromChannel,
} from '../events';
import { RealTimeService } from '../services';

@Injectable()
export class RealtimeListener {
  constructor(private readonly realTimeService: RealTimeService) { }

  // send real-time message individual
  @OnEvent(EVENT_TO_INDIVIDUAL)
  async sendEventToIndividual({ headers, emails, message_code,
    content, metadata, persistence }:
    EventToIndividual) {
    await this.realTimeService.setHeader(headers)
      .sendEventToIndividual(emails, message_code,
        content, metadata, persistence);
  }

  // send real-time message for shared collection
  @OnEvent(EVENT_TO_CHANNEL)
  async sendEventToChannel({ headers, channelId, message_code,
    content, metadata, persistence, type }:
    EventToChannel) {
    await this.realTimeService.setHeader(headers)
      .sendEventToChannel(channelId, message_code,
        content, metadata, type, persistence);
  }

  // send real-time message individual
  @OnEvent(NOTIFICATION_TO_INDIVIDUAL)
  async sendNotificationToIndividual({ headers, emails, message_code,
    content, metadata, persistence }:
    EventToIndividual) {
    await this.realTimeService.setHeader(headers)
      .sendNotificationToIndividual(emails, message_code,
        content, metadata, persistence);
  }

  // send real-time message for shared collection
  @OnEvent(NOTIFICATION_TO_CHANNEL)
  async sendNotificationToChannel({ headers, channelId, message_code,
    content, metadata, persistence, type }:
    EventToChannel) {
    await this.realTimeService.setHeader(headers)
      .sendNotificationToChannel(channelId, message_code,
        content, metadata, type, persistence);
  }

  // create real-time channel for shared collection
  @OnEvent(CREATE_REALTIME_CHANNEL)
  async createSharedCollection({ headers, channelId, members, type, title }:
    CreateChannel) {
    await this.realTimeService.setHeader(headers)
      .createChannel(channelId, title, type, members);
  }
  // leave real-time channel for shared collection
  @OnEvent(REMOVE_MEMBER_FROM_CHANNEL)
  async removeMember({ headers, channelId, members, type }:
    RemoveMemberFromChannel) {
    await this.realTimeService.setHeader(headers)
      .removeMemberFromChannel(channelId, members, type);
  }

  // join real-time channel for shared collection
  @OnEvent(ADD_MEMBER_TO_CHANNEL)
  async addMember({ headers, channelId, members, type }:
    AddMemberToChannel) {
    await this.realTimeService.setHeader(headers)
      .addMemberToChannel(channelId, members, type);
  }
  // Delete real-time channel
  @OnEvent(DELETE_REALTIME_CHANNEL)
  async deleteRealTimeChannel({ headers, channelId, type }: DeleteChannel) {
    await this.realTimeService.setHeader(headers)
      .deleteChannel(channelId, type);
  }
}