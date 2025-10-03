import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Message, MessageSendItem } from '../database/entities';
import {
  ChannelMemberRepository,
  ChannelRepository,
  UserUsageRepository
} from '../database/repositories';
import { ChannelEventListener } from '../listeners/channel.listener';
import { MessageModule } from '../message/message.module';
import { WebsocketMessageProvider } from '../message/provider/websocket.provider';
import { UserService } from '../user/user.service';
import { WebsocketModules } from '../websocket/websocket.modules';
import { ChannelController } from './channel.controller';
import { ChannelService } from './channel.service';

@Module({
  imports: [
    AuthModule,
    MessageModule,
    WebsocketModules,
    ChannelModule,
    TypeOrmModule.forFeature([Message, MessageSendItem]),
  ],
  controllers: [ChannelController],
  providers: [
    ChannelService,
    WebsocketMessageProvider,
    ChannelRepository,
    ChannelMemberRepository,
    ChannelEventListener,
    UserUsageRepository,
    UserService,
  ],
})
export class ChannelModule { }
