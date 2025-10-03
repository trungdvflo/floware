import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { FixedChannel, FixedChannels } from '../common/constants/system.constant';
import { LoggerService } from '../common/logger/logger.service';
import { getUTCSeconds } from '../common/utils/common';
import {
  ChannelMemberRepository,
  ChannelRepository
} from '../database/repositories';
import {
  AddChannelEvent,
  AddMemberToChannelEvent,
  EventName,
  RemoveChannelEvent,
  RemoveMemberToChannelEvent,
} from '../events/interface.event';
import { IPagination } from '../interface/pagination.interface';
import { WebsocketMessageProvider } from '../message/provider/websocket.provider';
import { CreateChannelParam, QuerySearch } from './channel-param.request';
@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);
  constructor(
    private readonly wsProvider: WebsocketMessageProvider,
    private readonly channelRes: ChannelRepository,
    private readonly channelMemberRes: ChannelMemberRepository,
    private eventEmitter: EventEmitter2
  ) { }

  async getChannel(email: string, query?: QuerySearch) {
    const pagination = {
      limit: query?.page_size,
      page: query?.page_no,
    } as IPagination;
    return await this.channelRes.getChannels(email, query, pagination);
  }

  async getChannelMember(channel: string) {
    const c = await this.channelRes.findOne({
      where: {
        name: channel,
      },
    });
    if (!c) {
      return { data: [] };
    }

    const members = await this.channelMemberRes.find({
      where: {
        channel_id: c.id,
      },
    });
    const membersEmail = members.map((member) => {
      return member.email;
    });
    return { data: membersEmail };
  }

  async deleteChannel(channelName: any) {
    if (FixedChannels.includes(channelName)) {
      throw new BadRequestException(
        `${channelName} is a system channel. You can not delete a channel system.`
      );
    }
    const channel = await this.channelRes.findOne({
      where: {
        name: channelName,
      },
    });

    if (!channel?.id) {
      throw new NotFoundException(`Channel ${channelName} is not found!`);
    }
    const members = await this.channelMemberRes.find({
      where: {
        channel_id: channel.id,
      },
    });
    const membersEmail = members.map((member) => {
      return member.email;
    });

    const isMemberChannelDeleted = await this.deleteAllMemberByChannel(channel.id);

    const isChannelDeleted = await this.channelRes.delete({
      name: channelName,
    });
    if (isMemberChannelDeleted) {
      await this.wsProvider.rmAllUserFromChannel(channelName);
    }
    // emit remove channel event
    this.eventEmitter.emit(EventName.CHANNEL_REMOVE, {
      channel: [channelName],
      member: membersEmail,
    } as RemoveChannelEvent);
    return {
      data: {
        channel_deleted: isChannelDeleted,
        member_channel_deleted: isMemberChannelDeleted,
      },
    };
  }

  async deleteAllMemberByChannel(channelId: number) {
    const isDeleted = await this.channelMemberRes.delete({
      channel_id: channelId,
    });
    return isDeleted;
  }

  async deleteMemberByChannelName(email: string, channelName: string) {
    const channel = await this.channelRes.findOne({
      where: {
        name: channelName,
      },
    });

    if (!channel?.id) {
      throw new NotFoundException(`Channel ${channelName} is not found!`);
    }
    const isDeleted = await this.channelMemberRes.delete({
      channel_id: channel.id,
      email,
    });
    if (isDeleted) {
      await this.wsProvider.rmUserFromChannel(email, channelName);
    }
    return {
      isDeleted
    };
  }

  async deleteMemberByChannel(email: string, channelId: number) {
    const isDeleted = await this.channelMemberRes.delete({
      channel_id: channelId,
      email,
    });
    return {
      isDeleted
    };
  }

  async revokeChannelMember(members: string[], channelName: any) {
    const channel = await this.getChannelItemOrthrowExceptionIfNotFound(channelName);
    const { memberSuccess, memberError } = await this.revokeMembersfromChannel(members, channel.id);
    for (const email of memberSuccess) {
      await this.wsProvider.rmUserFromChannel(email, channelName);
    }
    return {
      data: {
        member_error: memberError,
        member_sucess: memberSuccess,
      },
    };
  }

  async addChannelMember(members: string[], channelName: any) {
    const channel = await this.getChannelItemOrthrowExceptionIfNotFound(channelName);
    const { memberSuccess, memberError } = await this.addMembersToChannel(members, channel.id);
    for (const email of memberSuccess) {
      await this.wsProvider.addUserToChannel(email, channelName);
    }

    this.eventEmitter.emit(EventName.CHANNEL_ADD_MEMBER, {
      channel: [channelName],
      member: members,
    } as AddMemberToChannelEvent);
    return {
      data: {
        member_error: memberError,
        member_sucess: memberSuccess,
      },
    };
  }

  async deleteChannelMember(members: string[], channelName: any) {
    const channel = await this.getChannelItemOrthrowExceptionIfNotFound(channelName);

    const { memberSuccess, memberError } = await this.removeMembersFromChannel(members, channel.id);
    for (const email of memberSuccess) {
      await this.wsProvider.rmUserFromChannel(email, channelName);
    }
    this.eventEmitter.emit(EventName.CHANNEL_REMOVE_MEMBER, {
      channel: channelName,
      member: memberSuccess,
    } as RemoveMemberToChannelEvent);
    return {
      data: {
        member_error: memberError,
        member_sucess: memberSuccess,
      },
    };
  }

  async createChannel(data: CreateChannelParam) {
    if (FixedChannels.includes(data.name as FixedChannel)) {
      throw new BadRequestException(
        `Channel name ${data.name} is used for system channel, please input a other name.`
      );
    }
    try {
      const channelEntity = this.channelRes.create({
        ...data,
      });
      const channel = await this.channelRes.save(channelEntity);
      if (!channel?.id) {
        throw new InternalServerErrorException('Error while add channel');
      }
      const { memberSuccess, memberError } = await this.addMembersToChannel(
        data.members,
        channel.id
      );
      for (const email of memberSuccess) {
        await this.wsProvider.addUserToChannel(email, data.name);
      }
      this.eventEmitter.emit(EventName.CHANNEL_CREATE, {
        channel: [data.name],
        member: memberSuccess,
      } as AddChannelEvent);
      return {
        data: {
          channel: { messsage: 'add channel success', name: data?.name },
          member_error: memberError,
          member_sucess: memberSuccess,
        },
      };
    } catch (e) {
      LoggerService.getInstance().logError(e);
      if (e.code === 'ER_DUP_ENTRY') throw new BadRequestException('Error duplicated channel');
      throw e;
    }
  }

  async revokeMembersfromChannel(members: string[], channelId: number) {
    const memberSuccess = [];
    const memberError = [];
    if (members) {
      for (const email of members) {
        try {
          const channelMemberItem = await this.getChannelMemberItemOrthrowExceptionIfNotFound(
            channelId,
            email
          );
          channelMemberItem.revoke_date = getUTCSeconds();
          await this.channelMemberRes.save(channelMemberItem);
          memberSuccess.push(email);
        } catch (e) {
          memberError.push({ email, error: e.message });
          LoggerService.getInstance().logError(e);
        }
      }
    }
    return {
      memberError,
      memberSuccess,
    };
  }

  async addMembersToChannel(members: string[], channelId: number) {
    const memberSuccess = [];
    const memberError = [];
    if (members) {
      for (const email of members) {
        try {
          let memberEntity = await this.channelMemberRes.findOneBy({
            channel_id: channelId,
            email,
          });
          if (!memberEntity?.id) {
            memberEntity = this.channelMemberRes.create({
              channel_id: channelId,
              email,
            });
          }
          memberEntity.revoke_date = null;
          await this.channelMemberRes.save(memberEntity);
          memberSuccess.push(email);
        } catch (e) {
          memberError.push({ email, error: e.message });
          LoggerService.getInstance().logError(e);
        }
      }
    }
    return {
      memberError,
      memberSuccess,
    };
  }

  async removeMembersFromChannel(members: string[], channelId: number) {
    const memberSuccess = [];
    const memberError = [];
    if (members) {
      for (const email of members) {
        try {
          await this.channelMemberRes.delete({
            channel_id: channelId,
            email,
          });
          memberSuccess.push(email);
        } catch (e) {
          memberError.push({ email, error: e.message });
          LoggerService.getInstance().logError(e);
        }
      }
    }
    return {
      memberError,
      memberSuccess,
    };
  }

  async findUserByChannel(channel: string) {
    const c = await this.channelRes.findOne({
      where: { name: channel },
    });
    if (!c) {
      throw new NotFoundException('Channel Not found');
    }
    const cm = await this.channelMemberRes.find({
      where: {
        channel_id: c.id,
      },
    });

    const emails = cm.map((item) => {
      return item.email;
    });
    return emails;
  }

  async getChannelItemOrthrowExceptionIfNotFound(channelName: any) {
    if (FixedChannels.includes(channelName)) {
      throw new BadRequestException(
        `${channelName} is a system channel. You can not add the members to a channel system.`
      );
    }

    const channel = await this.channelRes.findOne({
      where: {
        name: channelName,
      },
    });

    if (!channel?.id) {
      throw new NotFoundException('Channel ' + channelName + ' not exist!');
    }
    return channel;
  }

  async getChannelMemberItemOrthrowExceptionIfNotFound(channelId: number, email: string) {
    const memberEntity = await this.channelMemberRes.findOneBy({
      channel_id: channelId,
      email,
    });

    if (!memberEntity?.id) {
      throw new NotFoundException('Member not exist in this channel!');
    }
    return memberEntity;
  }
}
