import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailDTO } from '../../../common/dtos/email.dto';
import { HeaderAuth, IUser } from '../../../common/interfaces';
import { LoggerService } from '../../../common/logger/logger.service';
import { getUtcSecond } from '../../../common/utils/date.util';
import cfApp from '../../../configs/app';
import { RealTimeEventMetadata } from '../events';
import {
  ChannelType,
  IChatMarked,
  IChatMessage,
  IChatMessagePut,
  IChatMetadata,
  IChatSettingPut,
  IMessagePayload,
  IPagination,
  Persistence,
  QoS,
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
  constructor(private readonly httpClient: HttpService, private readonly jwtService: JwtService) { }

  isEnableRealTime() {
    return process.env.REAL_TIME_ENABLE === 'true';
  }

  getReady() {
    if (!this.headers && !this.isEnableRealTime()) {
      throw new Error("Service real-time hasn't ready yet!");
    }
  }

  async getStatistics() {
    try {
      this.getReady();
      const { data } = await this.httpClient.axiosRef.get(
        `${cfApp().realTimeServiceURL}/statistics`,
        { headers: this.headers },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  async getWsAccessToken() {
    try {
      this.getReady();
      const {
        data: { data },
      } = await this.httpClient.axiosRef.get(`${cfApp().realTimeServiceURL}/ws/token`, {
        headers: this.headers,
      });
      return { socket_url: `${cfApp().realTimeServiceURLPublic}?token=${data.token}` };
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
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
  async sendSystemEventToChannel(
    channelId: number,
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    type: ChannelType,
    persistence: Persistence = Persistence.NONE_PERSISTENCE,
    send_offline: SendOffline = SendOffline.both,
    qos: QoS = 0,
    delay: number = 0,
    ignore_device_tokens: string[] = [],
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
      persistence,
      send_offline,
      qos,
      delay,
      ignore_device_tokens,
    } as IMessagePayload);
  }

  // Sends an event to an individual user
  async sendSystemEventToIndividual(
    email: string | string[],
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    persistence: Persistence = Persistence.NONE_PERSISTENCE,
    send_offline: SendOffline = SendOffline.both,
    qos: QoS = 0,
    delay: number = 0,
    ignore_device_tokens: string[] = [],
  ) {
    // Send the message in real-time
    return this.sendRealTimeSystemMessage({
      to: Array.isArray(email) ? email : [email],
      eventType: RType.EVENT,
      sendType: RSendType.USER,
      message_code,
      content,
      metadata,
      persistence,
      send_offline,
      qos,
      delay,
      ignore_device_tokens,
    } as IMessagePayload);
  }

  // Sends a notification to a channel
  async sendSystemNotificationToChannel(
    channelId: number,
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    type: ChannelType,
    persistence: Persistence = Persistence.PERSISTENCE,
    send_offline: SendOffline = SendOffline.both,
    qos: QoS = 0,
    delay: number = 0,
    ignore_device_tokens: string[] = [],
  ) {
    // Get the channel name based on the type
    const channel = this.getChannelNameByType(channelId, type);
    // Send the message in real-time
    return this.sendRealTimeSystemMessage({
      to: [channel],
      eventType: RType.NOTIFICATION,
      sendType: RSendType.CHANNEL,
      message_code,
      content,
      metadata,
      persistence,
      send_offline,
      qos,
      delay,
      ignore_device_tokens,
    } as IMessagePayload);
  }

  // Sends a notification to an individual user
  async sendSystemNotificationToIndividual(
    email: string | string[],
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    persistence: Persistence = Persistence.PERSISTENCE,
    send_offline: SendOffline = SendOffline.both,
    qos: QoS = 0,
    delay: number = 0,
    ignore_device_tokens: string[] = [],
  ) {
    // Send the message in real-time
    return this.sendRealTimeSystemMessage({
      to: Array.isArray(email) ? email : [email],
      eventType: RType.NOTIFICATION,
      sendType: RSendType.USER,
      message_code,
      content,
      metadata,
      persistence,
      send_offline,
      qos,
      delay,
      ignore_device_tokens,
    } as IMessagePayload);
  }

  // Sends an event to a channel
  async sendEventToChannel(
    channelId: number,
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    type: ChannelType,
    persistence: Persistence = Persistence.NONE_PERSISTENCE,
    send_offline: SendOffline = SendOffline.both,
    qos: QoS = 0,
    delay: number = 0,
    ignore_device_tokens: string[] = [],
  ) {
    // Get the channel name based on the type
    const channel = this.getChannelNameByType(channelId, type);
    // Send the message in real-time
    return this.sendRealTimeMessage({
      to: [channel],
      eventType: RType.EVENT,
      sendType: RSendType.CHANNEL,
      message_code,
      content,
      metadata,
      persistence,
      send_offline,
      qos,
      delay,
      ignore_device_tokens
    } as IMessagePayload);
  }

  // Sends an event to an individual user
  async sendEventToIndividual(
    email: string | string[],
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    persistence: Persistence = Persistence.NONE_PERSISTENCE,
    send_offline: SendOffline = SendOffline.both,
    qos: QoS = 0,
    delay: number = 0,
    ignore_device_tokens: string[] = [],
  ) {
    // Send the message in real-time
    return this.sendRealTimeMessage({
      to: Array.isArray(email) ? email : [email],
      eventType: RType.EVENT,
      sendType: RSendType.USER,
      message_code,
      content,
      metadata,
      persistence,
      send_offline,
      qos,
      delay,
      ignore_device_tokens,
    } as IMessagePayload);
  }

  // Sends a notification to a channel
  async sendNotificationToChannel(
    channelId: number,
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    type: ChannelType,
    persistence: Persistence = Persistence.PERSISTENCE,
    send_offline: SendOffline = SendOffline.both,
    qos: QoS = 0,
    delay: number = 0,
    ignore_device_tokens: string[] = [],
  ) {
    // Get the channel name based on the type
    const channel = this.getChannelNameByType(channelId, type);
    // Send the message in real-time
    return this.sendRealTimeMessage({
      to: [channel],
      eventType: RType.NOTIFICATION,
      sendType: RSendType.CHANNEL,
      message_code,
      content,
      metadata,
      persistence,
      send_offline,
      qos,
      delay,
      ignore_device_tokens
    } as IMessagePayload);
  }

  // Sends a notification to an individual user
  async sendNotificationToIndividual(
    email: string | string[],
    message_code: RealTimeMessageCode,
    content: string,
    metadata: RealTimeEventMetadata,
    persistence: Persistence = Persistence.PERSISTENCE,
    send_offline: SendOffline = SendOffline.both,
    qos: QoS = 0,
    delay: number = 0,
    ignore_device_tokens: string[] = [],
  ) {
    // Send the message in real-time
    return this.sendRealTimeMessage({
      to: Array.isArray(email) ? email : [email],
      eventType: RType.NOTIFICATION,
      sendType: RSendType.USER,
      message_code,
      content,
      metadata,
      persistence,
      send_offline,
      qos,
      delay,
      ignore_device_tokens
    } as IMessagePayload);
  }

  async createChannel(channelId: number, title: string, type: ChannelType,
    members: EmailDTO[]) {
    try {
      this.getReady();
      const { data } = await this.httpClient.axiosRef.post(
        `${cfApp().realTimeServiceURL}/channels`,
        {
          name: this.getChannelNameByType(channelId, type),
          members: members.map(({ email }) => email),
          type,
          internal_channel_id: channelId,
          title,
        },
        { headers: this.headers },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  async addMemberToChannel(channelId: number, members: EmailDTO[], type: ChannelType) {
    try {
      this.getReady();
      const cName = this.getChannelNameByType(channelId, type);
      const cMembers = members.map(({ email }) => email);
      const { data } = await this.httpClient.axiosRef.post(
        `${cfApp().realTimeServiceURL}/channels/${cName}/members`,
        {
          members: cMembers,
        },
        { headers: this.headers },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  async deleteChannel(channelId: number, type: ChannelType) {
    try {
      const cName = this.getChannelNameByType(channelId, type);
      this.getReady();

      const { data } = await this.httpClient.axiosRef.delete(
        `${cfApp().realTimeServiceURL}/channels/${cName}/members`,
        {
          headers: this.headers,
        },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  async revokeMemberFromChannel(channelId: number, members: EmailDTO[], type: ChannelType) {
    try {
      this.getReady();
      const cName = this.getChannelNameByType(channelId, type);
      const cMembers = members.map(({ email }) => email);
      const { data } = await this.httpClient.axiosRef.put(
        `${cfApp().realTimeServiceURL}/channels/${cName}/members`,
        { revoke_members: cMembers },
        { headers: this.headers },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  async removeMemberFromChannel(channelId: number, members: EmailDTO[], type: ChannelType) {
    try {
      const cName = this.getChannelNameByType(channelId, type);
      const cMembers = members.map(({ email }) => email);
      this.getReady();
      const { data } = await this.httpClient.axiosRef.delete(
        `${cfApp().realTimeServiceURL}/channels/${cName}/members`,
        {
          data: {
            members: cMembers,
          },
          headers: this.headers,
        },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  // Sends a message in real-time
  private async sendRealTimeMessage({
    to,
    eventType,
    sendType,
    message_code,
    content,
    metadata,
    persistence = Persistence.PERSISTENCE,
    send_offline = SendOffline.both,
    delay = 0,
    qos = 0,
    ignore_device_tokens = [],
  }: IMessagePayload): Promise<any> {
    try {
      this.getReady();
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
          send_offline,
          ignore_device_tokens
        } as RMessage,
        { headers: this.headers },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
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
    send_offline = SendOffline.both,
    delay = 0,
    qos = 0,
    ignore_device_tokens
  }: IMessagePayload): Promise<any> {
    try {
      this.getReady();
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
          send_offline,
          ignore_device_tokens
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
              token: process.env.APP_NAME || '',
            }),
          },
        },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  async sendChatMessage(
    channelId: number,
    type: ChannelType,
    metadata: IChatMetadata,
    content: string,
    parent_uid: string = null,
    marked: IChatMarked = null,
    external_message_uid: string = null,
  ) {
    try {
      this.getReady();
      const payload: IChatMessage = {
        channel: this.getChannelNameByType(channelId, type),
        content,
        metadata,
        parent_uid,
        marked,
      };
      // Setting external message UID in the payload for Real-time service if available
      if (external_message_uid) {
        payload.external_message_uid = external_message_uid;
      }

      const { data } = await this.httpClient.axiosRef.post(
        `${cfApp().realTimeServiceURL}/chat`,
        payload,
        { headers: this.headers },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  async getChannelChatMessage(
    channelId: number,
    parent_uid: string,
    type: ChannelType,
    paging: IPagination,
  ) {
    try {
      this.getReady();

      const { data } = await this.httpClient.axiosRef.get(
        `${cfApp().realTimeServiceURL}/chat/${this.getChannelNameByType(channelId, type)}/messages`,
        {
          params: {
            page_no: paging.page_no,
            page_size: paging.page_size,
            after_sent_time: paging.after_sent_time ?? 0,
            before_sent_time: paging.before_sent_time ?? getUtcSecond(),
            order_by_sent_time: !paging.sort ? 'desc' : paging.sort.includes('-') ? 'desc' : 'asc',
            parent_uid,
          },
          headers: this.headers,
        },
      );

      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  async getListChatAttachments(channelId: number, type: ChannelType) {
    try {
      this.getReady();
      const { data } = await this.httpClient.axiosRef.get(
        `${cfApp().realTimeServiceURL}/chat/${this.getChannelNameByType(
          channelId,
          type,
        )}/attachments`,
        { headers: this.headers },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  async getLastSeenMessages(channelId: number, type: ChannelType) {
    try {
      this.getReady();
      const { data } = await this.httpClient.axiosRef.get(
        `${cfApp().realTimeServiceURL}/chat/${this.getChannelNameByType(channelId, type)}/lastseen`,
        { headers: this.headers },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  async getChatSetting() {
    try {
      this.getReady();
      const { data } = await this.httpClient.axiosRef.get(
        `${cfApp().realTimeServiceURL}/settings`,
        { headers: this.headers },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  async updateSettings(setting: IChatSettingPut) {
    try {
      this.getReady();
      const { data } = await this.httpClient.axiosRef.put(
        `${cfApp().realTimeServiceURL}/settings`,
        setting,
        { headers: this.headers },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  async updateChatMessage(message_uid: string, content: string = null, metadata: IChatMetadata) {
    try {
      this.getReady();
      const { data } = await this.httpClient.axiosRef.put(
        `${cfApp().realTimeServiceURL}/chat/messages`,
        {
          message_uid,
          content,
          metadata,
        } as IChatMessagePut,
        { headers: this.headers },
      );

      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  async updateLastChatSeen(channelId: number, type: ChannelType, message_uid: string) {
    try {
      this.getReady();
      const { data } = await this.httpClient.axiosRef.put(
        `${cfApp().realTimeServiceURL}/chat/${this.getChannelNameByType(channelId, type)}/lastseen`,
        { message_uid },
        { headers: this.headers },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }

  async deleteChatMessage(message_uid: string) {
    try {
      this.getReady();
      const { data } = await this.httpClient.axiosRef.delete(
        `${cfApp().realTimeServiceURL}/chat/messages/${message_uid}`,
        { headers: this.headers },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
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

  async getChatMessage(message_uid: string) {
    try {
      this.getReady();
      const { data } = await this.httpClient.axiosRef.get(
        `${cfApp().realTimeServiceURL}/chat/messages/${message_uid}`,
        { headers: this.headers },
      );
      return data;
    } catch (error) {
      LoggerService.getInstance().logInternalError(error);
      return { error: error?.response?.data };
    }
  }
}