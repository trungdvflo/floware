import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { ChannelMemberRepository, UserUsageRepository } from '../database/repositories';
import { ChannelRepository } from '../database/repositories/channel.reposotory';
import { RedisModule } from '../redis/redis.module';
import { WebsocketModules } from '../websocket/websocket.modules';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [AuthModule, ConfigModule, WebsocketModules, RedisModule],
  controllers: [UserController],
  providers: [UserService, ChannelMemberRepository, UserUsageRepository, ChannelRepository],
})
export class UserModule {}
