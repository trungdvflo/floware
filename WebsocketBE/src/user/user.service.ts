import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { In } from 'typeorm';
import { ChannelMemberRepository, UserUsageRepository } from '../database/repositories';
import { ChannelRepository } from '../database/repositories/channel.reposotory';
import { WebsocketGateway } from '../websocket/websocket.gateway';

@Injectable()
export class UserService {
  constructor(
    private readonly userUsageReq: UserUsageRepository,
    private readonly ws: WebsocketGateway,
    private readonly channelMemberRes: ChannelMemberRepository,
    private readonly channelRep: ChannelRepository
  ) {}
  async userUsage(email: string) {
    let usage = await this.userUsageReq.findOneBy({
      email,
    });
    if (!usage) {
      usage = this.userUsageReq.create({
        email,
        attachment_count: 0,
        message_count: 0,
        attachment_size_usage: 0,
        message_size_usage: 0,
        channel_count: 0,
      });
    }

    const save = async () => {
      return await this.userUsageReq.save(usage);
    };

    return {
      usage,
      save,
      increAttachmentCount: (n: number) => {
        usage.attachment_count += n;
      },
      increMessageCount: (n: number) => {
        usage.message_count += n;
      },
      increAttachmentSize: (n: number) => {
        usage.attachment_size_usage += n;
      },
      increMessageSize: (n: number) => {
        usage.message_size_usage += n;
      },
      increChannelCount: (n: number) => {
        usage.channel_count += n;
      },
      reduceMessageSize: (n: number) => {
        usage.message_size_usage <= 0
          ? (usage.message_size_usage = 0)
          : (usage.message_size_usage -= n);
      },
      reduceAttachmentSize: (n: number) => {
        usage.attachment_size_usage <= 0
          ? (usage.attachment_size_usage = 0)
          : (usage.attachment_size_usage -= n);
      },
      reduceMessageCount: (n: number) => {
        usage.message_count <= 0 ? (usage.message_count = 0) : (usage.message_count -= n);
      },
      reduceAttachmentCount: (n: number) => {
        usage.attachment_count <= 0 ? (usage.attachment_count = 0) : (usage.attachment_count -= n);
      },
      reduceChannelCount: (n: number) => {
        usage.channel_count <= 0 ? (usage.channel_count = 0) : (usage.channel_count -= n);
      },
    };
  }

  async getUserOnline(email: string, channel?: string) {
    let emailsReplated = [];
    if (channel) {
      emailsReplated = await this.getUserRelatedByChannel(channel);
    } else {
      emailsReplated = await this.getUserRelatedByEmail(email);
    }
    if (emailsReplated.length <= 0) {
      return {
        data: [],
      };
    }
    const userOnline = await this.ws.getUsersOnlineFromCache(emailsReplated);
    return {
      data: userOnline,
    };
  }

  async getUserRelatedByChannel(channel: string) {
    const c = await this.channelRep.findOneBy({
      name: channel,
    });
    if (!c?.id) {
      throw new HttpException(`Channel ${channel} Not found`, HttpStatus.NOT_FOUND);
    }
    const members = await this.channelMemberRes.findBy({
      channel_id: c.id,
    });
    if (!members) {
      return [];
    }
    return members.map((m) => m.email);
  }

  async getUserRelatedByEmail(email: string) {
    const channels = await this.channelMemberRes.findBy({
      email,
    });
    const channelIds = channels.map((c) => c.channel_id);
    const members = await this.channelMemberRes.findBy({
      channel_id: In(channelIds),
    });
    if (!members) {
      return [];
    }

    return [...new Set(members.map((m) => m.email))];
  }
}
