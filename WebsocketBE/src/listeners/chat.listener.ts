import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { getUTCSeconds } from '../common/utils/common';
import { ChannelUserLastSeenRepository, ChatChannelStatusRepository } from '../database/repositories';
import { ChannelRepository } from '../database/repositories/channel.reposotory';
import {
  ChannelUserLastSeenEvent,
  ChatDeleteMessageEvent,
  ChatSendMessageEvent,
  ChatUpdateMessageEvent,
  EventName,
  WsClientConnectedEvent,
  WsClientDisConnectedEvent,
} from '../events/interface.event';
import { MessageFactory } from '../message/message.factory';
import { MessageService } from '../message/message.service';
import { SettingService } from '../setting/setting.service';
import { UserService } from '../user/user.service';
import { WsService } from '../websocket/service/websocket.service';

@Injectable()
export class ChatEventListener {
  constructor(
    private userService: UserService,
    private messageService: MessageService,
    private readonly settingService: SettingService,
    private readonly channelUserLastSeenRepo: ChannelUserLastSeenRepository,
    private readonly chatChannelStatusRepo: ChatChannelStatusRepository,
    private readonly channelRepository: ChannelRepository,
    private wsService: WsService
  ) { }

  @OnEvent(EventName.CHAT_MESSAGE_SEND)
  async handleChatSendMessageEvent(event: ChatSendMessageEvent) {
    const { message, user } = event;

    let size = Buffer.byteLength(message.payload?.content ?? '');
    if (message?.payload?.metadata) {
      const m = JSON.stringify(message?.payload?.metadata);
      size += Buffer.byteLength(m ?? '');
    }
    const usage = await this.userService.userUsage(user.email);
    usage.increMessageCount(1);
    usage.increMessageSize(size);
    const { attachments } = message?.payload?.metadata ?? [];
    if (attachments && Array.isArray(attachments)) {
      for (const attach of attachments) {
        if (!attach?.size) {
          continue;
        }
        usage.increAttachmentSize(attach?.size);
        usage.increAttachmentCount(1);
      }
    }
    await usage.save();
  }

  @OnEvent(EventName.CHAT_MESSAGE_EDIT)
  async handleChatUpdateMessageEvent(event: ChatUpdateMessageEvent) {
    const { old_message, new_message, email } = event;
    let sizeOld = Buffer.byteLength(old_message.content ?? '');
    if (old_message?.metadata) {
      sizeOld += Buffer.byteLength(old_message?.metadata ?? '');
    }

    let sizeNew = Buffer.byteLength(new_message.content ?? '');
    if (new_message?.metadata) {
      sizeNew += Buffer.byteLength(new_message?.metadata ?? '');
    }

    const sizeChange = sizeNew - sizeOld;
    const usage = await this.userService.userUsage(email);
    usage.increMessageSize(sizeChange);

    await usage.save();
  }

  @OnEvent(EventName.CHAT_MESSAGE_EDIT)
  async sendEventEditMessage(event: ChatUpdateMessageEvent) {
    const message = MessageFactory.createMessageEventMessageChatEdit(event);
    await this.messageService.send(message);
  }

  @OnEvent(EventName.CHAT_MESSAGE_DELETE)
  async sendEventDeleteMessage(event: ChatDeleteMessageEvent) {
    const message = MessageFactory.createMessageEventMessageChatDelete(event);
    await this.messageService.send(message);
  }

  @OnEvent(EventName.CHAT_MESSAGE_DELETE)
  async handleChatDeleteMessageEvent(event: ChatDeleteMessageEvent) {
    const { old_message: message, email } = event;
    let size = Buffer.byteLength(message.content ?? '');
    if (message?.metadata) {
      size += Buffer.byteLength(message?.metadata ?? '');
    }

    const usage = await this.userService.userUsage(email);
    usage.reduceMessageCount(1);
    usage.reduceMessageSize(size);
    await usage.save();
  }

  @OnEvent(EventName.CHAT_MESSAGE_SEND)
  async increaUnread(event: ChatSendMessageEvent) {
    const { message, user } = event;
    await this.channelUserLastSeenRepo.increaUnread(message.payload.channel);
    await this.channelUserLastSeenRepo.resetRemine(message.payload.channel);
    let ownerUserlastSeen = await this.channelUserLastSeenRepo.findOneBy({
      email: user.email,
      channel_name: message.payload.channel,
    });
    if (!ownerUserlastSeen?.id) {
      ownerUserlastSeen = this.channelUserLastSeenRepo.create({
        email: user.email,
        channel_name: message.payload.channel,
      });
    }
    ownerUserlastSeen.unread = 0;
    ownerUserlastSeen.last_message_uid = message.payload.message_uid;
    ownerUserlastSeen.last_seen = getUTCSeconds();
    await this.channelUserLastSeenRepo.save(ownerUserlastSeen);
  }

  @OnEvent(EventName.CHAT_MESSAGE_SEND)
  async updateChannelStatus(event: ChatSendMessageEvent) {
    const { message, user } = event;
    let channelStatus = await this.chatChannelStatusRepo.findOneBy({
      channel_name: message.payload.channel,
    });
    if (!channelStatus?.id) {
      channelStatus = this.chatChannelStatusRepo.create({
        channel_name: message.payload.channel,
        last_message_uid: message.payload.message_uid,
        last_send_time: getUTCSeconds(),
        msg_count: 0,
      });
    }
    channelStatus.msg_count += 1;
    channelStatus.last_send_time = getUTCSeconds();
    channelStatus.last_message_uid = message.payload.message_uid;
    await this.chatChannelStatusRepo.save(channelStatus);
  }

  @OnEvent(EventName.CHAT_MESSAGE_SEND)
  async sendNotificationNewMessage(event: ChatSendMessageEvent) {
    const { message } = event;
    const { userOffline } = await this.messageService.getUsers(message);
    if (userOffline.size <= 0) {
      return;
    }
    const channelObj = await this.channelRepository.findOneBy({
      name: message.payload.channel,
    });
    const userShowMsg = [];
    const userHideMsg = [];
    for (const user of [...userOffline]) {
      const channelSetting =
      await this.settingService.loadChannelSetting(user, message.payload.channel);
      if (!channelSetting.isTurnOnChatNotification()) {
        continue;
      }
      if (channelSetting.isChatNotificationHideMessage()) {
        userHideMsg.push(user);
      } else {
        userShowMsg.push(user);
      }
    }

    if (userHideMsg.length > 0) {
      await this.messageService.sendOffline(
        userHideMsg,
        MessageFactory.createMessageNotificationNewChatMessage(message, channelObj?.title, true)
      );
    }

    if (userShowMsg.length > 0) {
      await this.messageService.sendOffline(
        userShowMsg,
        MessageFactory.createMessageNotificationNewChatMessage(message, channelObj?.title, false)
      );
    }
  }

  @OnEvent(EventName.WS_CLIENT_OFFLINE)
  async updateCacheOfflineStatus(event: WsClientDisConnectedEvent) {
    await this.wsService.setOfflineStatus(event.client.data.user.email);
    await this.wsService.rmAllRoomFromCache(event.client.data.user.email);
  }

  @OnEvent(EventName.WS_CLIENT_OFFLINE)
  async notifyOffline(event: WsClientDisConnectedEvent) {
    let emailsReplated = await this.userService.getUserRelatedByEmail(event.client.data.user.email);
    emailsReplated = emailsReplated.filter((m) => m !== event.client.data.user.email);
    if (emailsReplated.length > 0) {
      const message = MessageFactory.createMessageEventUserOffline(event, emailsReplated);
      await this.messageService.send(message);
    }
  }

  @OnEvent(EventName.WS_CLIENT_ONLINE)
  async updateCacheOnlineStatus(event: WsClientConnectedEvent) {
    await this.wsService.setOnlineStatus(event.client.data.user.email);
  }

  @OnEvent(EventName.WS_CLIENT_ONLINE)
  async notifyOnline(event: WsClientConnectedEvent) {
    let emailsReplated = await this.userService.getUserRelatedByEmail(event.client.data.user.email);
    emailsReplated = emailsReplated.filter((m) => m !== event.client.data.user.email);
    if (emailsReplated.length > 0) {
      const message = MessageFactory.createMessageEventUserOnline(event, emailsReplated);
      await this.messageService.send(message);
    }
  }

  @OnEvent(EventName.CHAT_CHANNEL_USER_LAST_SEEN)
  async lastSeenEvent(event: ChannelUserLastSeenEvent) {
    const message = MessageFactory.createMessageEventUserSeen(event);
    await this.messageService.send(message);
  }
}
