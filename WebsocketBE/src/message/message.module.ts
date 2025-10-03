import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DeviceToken, MessageSendItem } from '../database/entities';
import {
  ChannelMemberRepository, ChannelUserLastSeenRepository,
  ChatChannelStatusRepository, DeviceTokenRepository,
  MessageAttachmentRepository, MessageChannelRepository,
  MessageEditedHistoryRepository, MessageRepository,
  MessageUserStatusRepository, UserUsageRepository
} from '../database/repositories';
import { ChannelRepository } from '../database/repositories/channel.reposotory';
import { ChatEventListener } from '../listeners/chat.listener';
import { MessageEventListener } from '../listeners/message.listener';
import { SettingModule } from '../setting/setting.module';
import { UserService } from '../user/user.service';
import { WebsocketModules } from '../websocket/websocket.modules';
import { ChatController } from './chat.controller';
import { ChatMessageService } from './chat.message.service';
import { MessageController } from './message.controller';
import { MessageService } from './message.service';
import { APNsProvider } from './provider/apns.provider';
import { WebsocketMessageProvider } from './provider/websocket.provider';
@Module({
  imports: [
    AuthModule,
    WebsocketModules,
    SettingModule,
    ConfigModule,
    TypeOrmModule.forFeature([DeviceToken, MessageSendItem]),
  ],
  controllers: [MessageController, ChatController],
  providers: [
    MessageService,
    APNsProvider,
    WebsocketMessageProvider,
    MessageAttachmentRepository,
    ChannelRepository,
    MessageRepository,
    ChannelMemberRepository,
    MessageChannelRepository,
    ChatMessageService,
    MessageUserStatusRepository,
    MessageEditedHistoryRepository,
    ChatEventListener,
    MessageEventListener,
    UserUsageRepository,
    ChannelUserLastSeenRepository,
    DeviceTokenRepository,
    ChatChannelStatusRepository,
    UserService,
  ],
  exports: [MessageService, ChatMessageService],
})
export class MessageModule {}
