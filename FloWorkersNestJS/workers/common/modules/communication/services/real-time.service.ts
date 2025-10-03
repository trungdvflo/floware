import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import cfApp from '../../../../common/configs/worker.config';
import { IUser } from '../../../../common/interface/user.interface';
import { Graylog } from '../../../../common/utils/graylog';
import { RealTimeEventMetadata } from '../events';
import {
  ChannelType,
  IMessagePayload,
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
  constructor(private readonly httpClient: HttpService,
    private readonly jwtService: JwtService,
  ) { }

  isEnableRealTime() {
    return process.env.REAL_TIME_ENABLE === 'true';
  }

  getReady() {
    if (!this.isEnableRealTime()) {
      throw new Error("Service real-time hasn't ready yet!");
    }
  }

  async generateWsAccessToken(user: IUser) {
    return this.jwtService.signAsync(user);
  }

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
    return this.sendRealTimeSystemMessage({
      to: [channel],
      eventType: RType.EVENT,
      sendType: RSendType.CHANNEL,
      message_code,
      content,
      metadata,
      persistence
    } as IMessagePayload);
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
    return this.sendRealTimeSystemMessage({
      to: Array.isArray(email)
        ? email
        : [email],
      eventType: RType.EVENT,
      sendType: RSendType.USER,
      message_code,
      content,
      metadata,
      persistence
    } as IMessagePayload);
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
    return this.sendRealTimeSystemMessage(
      {
        to: [channel],
        eventType: RType.NOTIFICATION,
        sendType: RSendType.CHANNEL,
        message_code,
        content,
        metadata,
        persistence
      } as IMessagePayload);
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
    return this.sendRealTimeSystemMessage({
      to: Array.isArray(email)
        ? email
        : [email],
      eventType: RType.NOTIFICATION,
      sendType: RSendType.USER,
      message_code,
      content,
      metadata,
      persistence
    } as IMessagePayload);
  }

  // Sends a message in real-time
  private async sendRealTimeSystemMessage({
    to,
    eventType,
    sendType,
    message_code,
    content,
    metadata,
    persistence = Persistence.PERSISTENCE,
    send_offline = SendOffline.no,
    delay = 0,
    qos = 0
  }: IMessagePayload): Promise<any> {
    try {
      this.getReady();
      const { data } = await this.httpClient.axiosRef.post(
        `${cfApp().realTimeServiceURL}/messages`, {
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
      Graylog.getInstance().logInfo({
        moduleName: 'REAL TIME SERVICE',
        jobName: '',
        message: 'ERROR::' + error,
        fullMessage: 'ERROR::' + error
      });
      return { error: error?.response?.data };
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