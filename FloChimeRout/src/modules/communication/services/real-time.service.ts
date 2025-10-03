/* eslint-disable prettier/prettier */
import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoggerService } from '../../../common/logger/logger.service';
import cfApp from '../../../configs/app.config';
import { RealTimeEventMetadata } from '../events';
import { EmailDTO, HeaderAuth, IUser } from '../interfaces';

import { ChannelTypeNumber } from 'common/constants/system.constant';
import {
  ChannelType,
  IChatMessage,
  IChatMetadata,
  Persistence,
  RMessage,
  RSendType,
  RType,
  RealTimeInterface,
  RealTimeMessageCode,
  SendOffline
} from '../interfaces/real-time.interface';

@Injectable()
export class RealTimeService implements RealTimeInterface {
  headers: HeaderAuth;
  constructor(private readonly httpClient: HttpService,
    private readonly jwtService: JwtService,
  ) { }
  // Sends an event to a channel
  async sendSystemEventToChannel(
    channelId: number,
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    type: ChannelType,
    persistence: Persistence = Persistence.NONE_PERSISTENCE
  ) {
    // Get the channel name based on the type
    const channel = this.getChannelNameByType(channelId, type);
    // Send the message in real-time
    return this.sendRealTimeSystemMessage([channel], RType.EVENT, RSendType.CHANNEL,
      message_code, content, metadata, persistence);
  }

  // Sends an event to an individual user
  async sendSystemEventToIndividual(
    email: string | string[],
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    persistence: Persistence = Persistence.NONE_PERSISTENCE,
  ) {
    // Send the message in real-time
    return this.sendRealTimeSystemMessage(
      Array.isArray(email)
        ? email
        : [email], RType.EVENT, RSendType.USER, message_code, content, metadata, persistence);
  }

  // Sends a notification to a channel
  async sendSystemNotificationToChannel(
    channelId: number,
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    type: ChannelType,
    persistence: Persistence = Persistence.PERSISTENCE
  ) {
    // Get the channel name based on the type
    const channel = this.getChannelNameByType(channelId, type);
    // Send the message in real-time
    return this.sendRealTimeSystemMessage([channel],
      RType.NOTIFICATION, RSendType.CHANNEL, message_code, content, metadata, persistence);
  }

  // Sends a notification to an individual user
  async sendSystemNotificationToIndividual(
    email: string | string[],
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    persistence: Persistence = Persistence.PERSISTENCE
  ) {
    // Send the message in real-time
    return this.sendRealTimeSystemMessage(
      Array.isArray(email)
        ? email
        : [email],
      RType.NOTIFICATION, RSendType.USER, message_code, content, metadata, persistence);
  }

  isEnableRealTime() {
    return process.env.REAL_TIME_ENABLE === 'true';
  }

  getReady() {
    if (!this.headers || !this.isEnableRealTime()) {
      throw new Error("Service real time hasn't ready yet!");
    }
  }

  async generateWsAccessToken(user: IUser) {
    return this.jwtService.signAsync(user);
  }

  setHeader(headers: HeaderAuth) {
    const { app_id, device_uid, authorization } = headers;
    this.headers = { app_id, device_uid, authorization };
    return this;
  }

  // Sends an event to a channel
  async sendEventToChannel(
    channelId: number,
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    type: ChannelType,
    persistence: Persistence = Persistence.NONE_PERSISTENCE
  ) {
    // Get the channel name based on the type
    const channel = this.getChannelNameByType(channelId, type);
    // Send the message in real-time
    return this.sendRealTimeMessage([channel], RType.EVENT, RSendType.CHANNEL,
      message_code, content, metadata, persistence);
  }

  // Sends an event to an individual user
  async sendEventToIndividual(
    email: string | string[],
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    persistence: Persistence = Persistence.NONE_PERSISTENCE,
  ) {
    // Send the message in real-time
    return this.sendRealTimeMessage(
      Array.isArray(email)
        ? email
        : [email], RType.EVENT, RSendType.USER, message_code, content, metadata, persistence);
  }

  // Sends a notification to a channel
  async sendNotificationToChannel(
    channelId: number,
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    type: ChannelType,
    persistence: Persistence = Persistence.PERSISTENCE
  ) {
    // Get the channel name based on the type
    const channel = this.getChannelNameByType(channelId, type);
    // Send the message in real-time
    return this.sendRealTimeMessage([channel],
      RType.NOTIFICATION, RSendType.CHANNEL, message_code, content, metadata, persistence);
  }

  // Sends a notification to an individual user
  async sendNotificationToIndividual(
    email: string | string[],
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    persistence: Persistence = Persistence.PERSISTENCE
  ) {
    // Send the message in real-time
    return this.sendRealTimeMessage(
      Array.isArray(email)
        ? email
        : [email],
      RType.NOTIFICATION, RSendType.USER, message_code, content, metadata, persistence);
  }
  async createChannel(
    channelId: number,
    title: string,
    type: ChannelType,
    members: EmailDTO[]
  ) {
    try {
      this.getReady();
      const { data } = await this.httpClient.axiosRef.post(
        `${cfApp().realTimeServiceURL}/channels`,
        {
          name: this.getChannelNameByType(channelId, type),
          members: members.map(({ email }) => email),
          type,
          internal_channel_id: channelId,
          title
        },
        { headers: this.headers }
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return false;
    }
  }

  async addMemberToChannel(
    channelId: number,
    members: EmailDTO[],
    type: ChannelType
  ) {
    try {
      this.getReady();
      const cName = this.getChannelNameByType(channelId, type);
      const cMembers = members.map(({ email }) => email);
      const { data } = await this.httpClient.axiosRef.post(
        `${cfApp().realTimeServiceURL}/channels/${cName}/members`,
        {
          members: cMembers
        },
        { headers: this.headers }
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return false;
    }
  }

  async deleteChannel(channelId: number, type: ChannelType) {
    throw new Error('Method not implemented.');
  }

  async removeMemberFromChannel(
    channelId: number,
    members: EmailDTO[],
    type: ChannelType
  ) {
    try {
      const cName = this.getChannelNameByType(channelId, type);
      const cMembers = members.map(({ email }) => email);
      this.getReady();

      const { data } = await this.httpClient.axiosRef.delete(
        `${cfApp().realTimeServiceURL}/channels/${cName}/members`,
        {
          data: {
            members: cMembers
          },
          headers: this.headers
        }
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return false;
    }
  }

  // Sends a message in real-time
  private async sendRealTimeMessage(
    to: string[],
    eventType: RType,
    sendType: RSendType,
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    persistence: Persistence = Persistence.PERSISTENCE,
    send_offline: SendOffline = SendOffline.no,
    delay = 0,
    qos = 0
  ): Promise<any> {
    try {
      this.getReady();

      // Send the message using HTTP POST request
      const { data } = await this.httpClient.axiosRef.post(
        `${cfApp().realTimeServiceURL}/messages`,
        {
          message_code,
          event_type: eventType,
          send_type: sendType,
          persistence,
          to,
          content,
          metadata,
          delay,
          qos,
          send_offline
        } as RMessage,
        { headers: this.headers }
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return false;
    }
  }

  // Sends a message in real-time
  private async sendRealTimeSystemMessage(
    to: string[],
    eventType: RType,
    sendType: RSendType,
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    persistence: Persistence = Persistence.PERSISTENCE,
    send_offline: SendOffline = SendOffline.no,
    delay = 0,
    qos = 0
  ): Promise<any> {
    try {
      this.getReady();

      // Send the message using HTTP POST request
      const { data } = await this.httpClient.axiosRef.post(
        `${cfApp().realTimeServiceURL}/messages`,
        {
          message_code,
          event_type: eventType,
          send_type: sendType,
          persistence,
          to,
          content,
          metadata,
          delay,
          qos,
          send_offline
        } as RMessage,
        {
          headers: {
            system_token: await this.generateWsAccessToken({
              userId: 0,
              id: 0,
              email: 'SYSTEM',
              appId: '',
              deviceUid: '',
              userAgent: '',
              token: process.env.APP_NAME || ''
            })
          }
        }
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return false;
    }
  }

  async sendChatMessage(channelId: number, type: ChannelType,
    metadata: IChatMetadata, content: string, external_message_uid: string = null) {
    try {
      this.getReady();
      const payload: IChatMessage = {
        channel: this.getChannelNameByType(channelId, type),
        content,
        metadata
      };
      if (external_message_uid) {
        payload.external_message_uid = external_message_uid;
      }
      const { data } = await this.httpClient.axiosRef.post(
        `${cfApp().realTimeServiceURL}/chat`,
        payload,
        { headers: this.headers }
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return false;
    }
  }
  
  getChannelTypeFromNumber(channelTypeNumber: ChannelTypeNumber): ChannelType | null {
    switch (channelTypeNumber) {
      case ChannelTypeNumber.SHARED_COLLECTION:
        return ChannelType.SHARED_COLLECTION;
      case ChannelTypeNumber.CONFERENCE:
        return ChannelType.CONFERENCE;
      default:
        return null;
    }
  }
  
  private getChannelNameByType(channelId: number, type: ChannelType) {
    switch (type) {
      case ChannelType.SHARED_COLLECTION:
      case ChannelType.CONFERENCE:
        return `${type}_${channelId}`;
      default:
        return `REALTIME_CHANNEL_${channelId}`;
    }
  }
}