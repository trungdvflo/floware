import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  ChannelMemberRepository, ChatChannelStatusRepository,
  DeviceTokenRepository, MessageUserStatusRepository
} from '../database/repositories';
import { ChannelRepository } from '../database/repositories/channel.reposotory';
import { ClientEventListener } from '../listeners/client.listener';
import { MessageModule } from '../message/message.module';
import { SettingModule } from '../setting/setting.module';
import { WebsocketModules } from '../websocket/websocket.modules';
@Module({
  imports: [
    AuthModule,
    ConfigModule,
    SettingModule,
    MessageModule,
    WebsocketModules,
    TypeOrmModule.forFeature([DeviceTokenRepository]),
  ],
  providers: [
    ChannelRepository,
    ClientEventListener,
    MessageUserStatusRepository,
    ChannelMemberRepository,
    ChatChannelStatusRepository,
  ],
  exports: [],
  controllers: [],
})
export class ListenerModule {}
