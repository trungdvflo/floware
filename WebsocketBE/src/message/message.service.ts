import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { getUTCSeconds } from 'src/common/utils/common';
import { IsNull } from 'typeorm';
import {
  FixedChannel,
  FixedChannels,
  WS_CURRENT_USER_CHANNEL_PREFIX,
} from '../common/constants/system.constant';
import { LoggerService } from '../common/logger/logger.service';
import {
  ChannelMemberRepository, MessageChannelRepository,
  MessageRepository, MessageUserStatusRepository
} from '../database/repositories';
import { ChannelRepository } from '../database/repositories/channel.reposotory';
import { EventName } from '../events/interface.event';
import {
  IChatMessage,
  IMessage,
  MessageFilter,
  Status,
  Type
} from '../interface/message.interface';
import { IPagination } from '../interface/pagination.interface';
import { BROADCAST_CHANNEL } from '../websocket/websocket.gateway';
import { APNsProvider } from './provider/apns.provider';
import { WebsocketMessageProvider } from './provider/websocket.provider';
@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);
  constructor(
    private readonly messageProvider: WebsocketMessageProvider,
    private readonly apnProvider: APNsProvider,
    private readonly messageReq: MessageRepository,
    private readonly channelRep: ChannelRepository,
    private readonly channelMemberReq: ChannelMemberRepository,
    private readonly messageChannelReq: MessageChannelRepository,
    private readonly messageUserStatusReq: MessageUserStatusRepository,
    private eventEmitter: EventEmitter2
  ) { }

  async send(message: IMessage | IChatMessage) {
    try {
      const { to: toChannels } = message.header;
      for (const channel of toChannels) {
        if (!message.isSendChannel()) {
          continue;
        }
        // check channel is system channel
        if (FixedChannels.includes(channel as FixedChannel)) {
          continue;
        }
        const c = await this.channelRep.findOne({
          where: { name: channel },
        });
        if (!c) {
          throw new HttpException(`Channel ${channel} Not found`, HttpStatus.NOT_FOUND);
        }
      }

      // get user offline
      const { userOffline, userOnline } = await this.getUsers(message);
      // send offline if message is notification via apns
      if (message.isSendAllDeviceOfUserOffline() && userOffline.size > 0) {
        await this.apnProvider.send([...userOffline], message);
      }

      if (message.isSendAllDevices() && (userOffline.size > 0 || userOnline.size > 0)) {
        const devicesOnline = await this.getDevicesOnline([...userOffline, ...userOnline]);
        message.ignore_devices = devicesOnline;
        await this.apnProvider.send([...userOffline, ...userOnline], message);
      }

      // emit event before send
      await this.eventEmitter.emitAsync(EventName.MESSAGE_BEFORE_SEND, {
        message,
        to_actual_user: [...userOnline],
      });

      // send to user online via websocket
      let created_date = null;
      let updated_date = null;
      let deleted_date = null;

      if (message.isSendAtLeastOnce() || message.isPersistence()) {
        const m = await (
          message.isMessageChat()
            ? // NEW chat message
            this.saveChatMessage(message as IChatMessage)
            : // EVENT | NOTIFICATION
            this.saveMessage(message as IMessage)
        );

        created_date = m.created_date ?? 0;
        updated_date = m.updated_date ?? 0;
        deleted_date = m.deleted_date ?? 0;

        await this.saveMessageChannel(message, toChannels);
        if (!message.isMessageChat() && userOffline.size > 0) {
          // mark unread new chat message
          await this.saveMessageStatusUnsent(message, [...userOffline]);
        }
      }

      let results = [];
      if (message.isChat()) { // push realtime when NEW | EDIT | DELETE chat message
        created_date = created_date ?? (message as IChatMessage).payload.created_date;
        updated_date = updated_date ?? (message as IChatMessage).payload.updated_date;
        deleted_date = deleted_date ?? (message as IChatMessage).payload.deleted_date;

        message.payload = {
          ...message.payload,
          created_date,
          updated_date,
          deleted_date
        };
        results = await this.messageProvider.sendChat(message.header.to, message as IChatMessage);
      } else {
        results = await this.messageProvider.send(message.header.to, message);
      }

      if (created_date !== null && updated_date !== null && deleted_date !== null) {
        return {
          data: results.map((r) => {
            return {
              ...r,
              created_date,
              updated_date,
              deleted_date
            };
          }),
        };
      }

      return {
        data: results,
      };
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }

  async sendOffline(users: string[], message: IMessage) {
    await this.apnProvider.send(users, message);
  }

  async findUserByChannel(channel: string) {
    const c = await this.channelRep.findOne({
      where: { name: channel },
    });
    if (!c) {
      throw new HttpException(`Channel ${channel} Not found`, HttpStatus.NOT_FOUND);
    }

    const cm = await this.channelMemberReq.find({
      where: {
        channel_id: c.id,
        revoke_date: IsNull()
      },
    });

    const emails = cm.map((item) => {
      return item.email;
    });
    return emails;
  }

  async getDevicesOnline(users: string[]) {
    let devices = [];
    for (const user of users) {
      const usockets = await this.messageProvider.getUserSockets(user);
      const socketWithoutWeb = usockets.filter((socket) => socket.platform !== 'web');
      if (socketWithoutWeb?.length > 0) {
        const deviceOnlines = usockets.map((socket) => {
          return socket.deviceUid;
        });
        devices = [...devices, ...deviceOnlines];
      }
    }
    return devices;
  }

  async getUsers(message: IMessage) {
    const { to: toChannels } = message.header;
    // get user offline
    const userOffline = new Set<string>();
    // get user online
    const userOnline = new Set<string>();
    for (const channel of toChannels) {
      // skip send offline if channel is system channel
      if (FixedChannels.includes(channel as FixedChannel)) {
        continue;
      }

      if (channel === BROADCAST_CHANNEL) {
        const allUserOnline = await this.messageProvider.getUsersOnlineFromCache();
        for (const email of allUserOnline) {
          userOnline.add(email);
        }
        return { userOffline, userOnline };
      }

      if (message.isSendUser()) {
        const email = channel.replace(WS_CURRENT_USER_CHANNEL_PREFIX, '');
        const isUserOffline = await this.messageProvider.isUserOffline(email);
        if (isUserOffline) {
          userOffline.add(email);
          continue;
        }
        userOnline.add(email);
      } else {
        const emails = await this.findUserByChannel(channel);
        for (const email of emails) {
          const isUserOffline = await this.messageProvider.isUserOffline(email);
          if (isUserOffline) {
            userOffline.add(email);
            continue;
          }
          userOnline.add(email);
        }
      }
    }
    return { userOffline, userOnline };
  }

  async saveMessageStatusUnsent(message: IMessage, users: string[]) {
    const unsentData = [];
    for (const u of users) {
      unsentData.push(
        this.messageUserStatusReq.create({
          message_uid: message.payload.message_uid,
          email: u,
          status: Status.unsent,
        })
      );
    }
    return await this.messageUserStatusReq.save(unsentData);
  }

  async saveMessageChannel(message: IMessage, toChannels: string[]) {
    const messageChannels = [];
    for (const channel of toChannels) {
      messageChannels.push({
        message_uid: message.payload.message_uid,
        channel_name: channel,
      });
    }
    if (messageChannels.length <= 0) {
      return null;
    }
    return await this.messageChannelReq.save(this.messageChannelReq.create(messageChannels));
  }

  async saveMessage(message: IMessage) {
    const { to, from, send_type, event_type } = message.header;
    const {
      message_uid,
      metadata,
      content,
      message_code,
    } = message.payload;

    const msg = this.messageReq.create({
      type: event_type,
      content: typeof content === 'string' ? content : JSON.stringify(content),
      metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
      uid: message_uid,
      code: message_code,
      from,
      send_type,
      to_channel: to.join(','),
      status: Status.sent,
      qos: message.option.qos,
      sent_time: getUTCSeconds(),
    });
    return await this.messageReq.save(msg);
  }

  async saveChatMessage(message: IChatMessage) {
    const { to, from, send_type, event_type } = message.header;
    const {
      message_uid,
      metadata,
      content,
      message_code,
      parent_uid,
      content_marked,
      message_marked,
    } = message.payload;

    const msg = this.messageReq.create({
      type: event_type,
      content: typeof content === 'string' ? content : JSON.stringify(content),
      metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
      uid: message_uid,
      code: message_code,
      from,
      send_type,
      to_channel: to.join(','),
      parent_uid,
      content_marked,
      message_marked: JSON.stringify(message_marked),

      status: Status.sent,
      qos: message.option.qos,
      sent_time: getUTCSeconds(),
    });
    return await this.messageReq.save(msg);
  }

  async getNotificationMessages(filter: MessageFilter, pagination: IPagination) {
    return this.messageReq.getNotificationMessages(filter, pagination);
  }

  async updateNotificationStatus(uids: string[], status: Status, email: string) {
    const success = [];
    const error = [];
    for (const uid of uids) {
      const result = await this.updateNotificationStatusItem(uid, status, email);
      if (result?.error) {
        error.push(result);
      } else {
        success.push(result.message_uid);
      }
    }

    return { data: { success, error } };
  }

  async updateNotificationStatusItem(uid: string, status: Status, email: string) {
    try {
      const message = await this.messageReq.findOneBy({
        uid,
        type: Type.NOTIFICATION,
      });
      if (!message?.id) {
        return { message_uid: uid, error: 'not found' };
      }
      let statusMessage = await this.messageUserStatusReq.findOneBy({
        message_uid: uid,
        email,
      });
      if (!statusMessage?.id) {
        statusMessage = this.messageUserStatusReq.create({
          message_uid: uid,
          email,
        });
      }
      statusMessage.status = status;

      await this.messageUserStatusReq.save(statusMessage);
      return { message_uid: uid };
    } catch (error) {
      LoggerService.getInstance().logError(error);
      return { message_uid: uid, error };
    }
  }
}
