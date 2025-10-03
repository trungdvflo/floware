import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LessThan } from 'typeorm';
import {
  IMessagePayload,
  Persistence,
  RMessage,
  RSendType,
  RType,
  RealTimeMessageCode,
  SendOffline
} from 'workers/common/interface/realtime.interface';
import { IUser } from 'workers/common/interface/user.interface';
import { RealtimeChannelMemberRepository } from 'workers/common/repository/realtime-channel-member.repository';
import { RealtimeChatChannelStatusRepository } from 'workers/common/repository/realtime-chat-channel-status.repository';
import { RealtimeChannelUserLastSeenRepository } from 'workers/common/repository/realtime-chat-channel-user-last-seen.repository';
import { Graylog } from 'workers/common/utils/graylog';
import cfApp from '../../common/configs/worker.config';

@Injectable()
export class RealtimeService {
  constructor(
    private readonly httpClient: HttpService,
    private readonly jwtService: JwtService,
    private readonly realtimeChatChanelStatusRepo: RealtimeChatChannelStatusRepository,
    private readonly realtimeChannelMemberRepo: RealtimeChannelMemberRepository,
    private readonly realtimeChannelUserLastSeenRepo: RealtimeChannelUserLastSeenRepository
  ) {}
  async reminderMissMessage() {
    try {
      if (!this.isEnableRealTime()) {
        return;
      }

      const currentTime = new Date().getTime() / 1000;
      // get from config and convert to seconds
      const durrationTimeMissChatConf = (+process.env.REAL_TIME_MISS_NOTI_AFTER_MINS || 10) * 60;
      const targetSentTimePushMissChat = currentTime - durrationTimeMissChatConf;
      // find channel has last sent time in {durrationTimeMissChatConf} seconds before.
      const channelsStatus = await this.realtimeChatChanelStatusRepo.findBy(
        {last_send_time: LessThan(targetSentTimePushMissChat)});
      const targetUsers = {};
      for (const channelStatus of channelsStatus) {
        const { msg_count, channel_name } = channelStatus;
        const members = await this.realtimeChannelMemberRepo.getMemberUnread(channel_name);
        for (const member of members) {
            const unread = member?.unread || msg_count;
            const { email, channel, channel_title } = member;
            targetUsers[email] = targetUsers[email] || [];
            targetUsers[email].push({
                channel,
                unread,
                channel_title,
                isExistRecord: member?.unread ? true : false
            });
        }
      }
      for (const email of Object.keys(targetUsers)) {
        const channelUsersStatus = targetUsers[email];
        const content = "You may have missed some chat messages.";
        const metadaChannel = channelUsersStatus.map((c) => {
          return {channel: c.channel, title: c.channel_title, unread: c.unread};});
        await this.sendMissChatToUser(email, content,
          { chanel: metadaChannel, title: `${email} in ${metadaChannel[0].title}` });
        for (const channelUserStatus of channelUsersStatus) {
          const { channel, unread, isExistRecord } = channelUserStatus;
          if (isExistRecord) {
            await this.updateUnreadAndRemine(email, channel);
          } else {
            await this.updateUnreadAndRemine(email, channel, unread);
          }
        }
      }
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: 'REALTIME::CRON_REMINDER',
        message: error.message
      });
    }
  }

  async updateUnreadAndRemine(email: string, channel: string, unread?: number) {
    let lastSeen = await this.realtimeChannelUserLastSeenRepo.findOneBy({
      email,
      channel_name: channel
    });
    if (!lastSeen?.id) {
      lastSeen = this.realtimeChannelUserLastSeenRepo.create({
        email,
        channel_name: channel,
        remine: 0
      });
    }
    if (unread) {
      lastSeen.unread = unread;
    }
    lastSeen.remine = (lastSeen?.remine || 0) + 1;
    await this.realtimeChannelUserLastSeenRepo.save(lastSeen);
  }

  async sendMissChatToUser(email: string, content: string, metadata: any) {
    await this.sendRealTimeSystemMessage({
      to: [email],
      eventType: RType.NOTIFICATION,
      sendType: RSendType.USER,
      content,
      delay: 0,
      metadata: {
        event_timestamp: new Date().getTime() / 1000,
        ...metadata
      },
      message_code: RealTimeMessageCode.CHAT_USER_MISS,
      qos: 0,
      send_offline: SendOffline.yes,
      persistence: Persistence.NONE_PERSISTENCE
    } as IMessagePayload);
  }

  isEnableRealTime() {
    return process.env.REAL_TIME_ENABLE === 'true';
  }

  async generateWsAccessToken(user: IUser) {
    return this.jwtService.signAsync(user);
  }

  // Sends a message in real-time
  async sendRealTimeSystemMessage({
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
              token: ''
            })
          }
        }
      );
      return data;
    } catch (error) {
      Graylog.getInstance().logInfo({
        moduleName: 'REALTIME::CRON_REMINDER',
        message: error.message
      });
      return false;
    }
  }
}
