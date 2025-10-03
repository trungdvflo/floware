import { Module } from '@nestjs/common';

import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelModule } from '../channel/channel.module';
import { ChannelService } from '../channel/channel.service';
import { Message, MessageSendItem } from '../database/entities';
import {
  ChannelMemberRepository, ChannelUserLastSeenRepository,
  DeviceTokenRepository, MessageAttachmentRepository, MessageChannelRepository,
  MessageEditedHistoryRepository, MessageRepository,
  MessageUserStatusRepository, UserUsageRepository
} from '../database/repositories';
import { ChannelRepository } from '../database/repositories/channel.reposotory';
import { ChatMessageService } from '../message/chat.message.service';
import { MessageModule } from '../message/message.module';
import { MessageService } from '../message/message.service';
import { APNsProvider } from '../message/provider/apns.provider';
import { WebsocketMessageProvider } from '../message/provider/websocket.provider';
import { SettingModule } from '../setting/setting.module';
import { WebsocketModules } from '../websocket/websocket.modules';
import { ChannelSubscriber } from './channel.subscriber';
import { MessageSubscriber } from './message.subscriber';
@Module({
  imports: [
    WebsocketModules,
    MessageModule,
    ChannelModule,
    SettingModule,
    TypeOrmModule.forFeature([Message, MessageSendItem, MessageRepository, DeviceTokenRepository]),
  ],
  controllers: [],
  providers: [
    MessageSubscriber,
    ChannelSubscriber,
    MessageService,
    ChannelService,
    ChatMessageService,
    WebsocketMessageProvider,
    APNsProvider,
    ChannelRepository,
    ChannelMemberRepository,
    MessageChannelRepository,
    MessageAttachmentRepository,
    MessageUserStatusRepository,
    MessageEditedHistoryRepository,
    UserUsageRepository,
    ChannelUserLastSeenRepository,
  ],
  exports: [],
})
export class MicroserviceSubscriberModule { }
