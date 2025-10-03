import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChatChannelStatus } from '../entities/chat-channel-status.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class ChatChannelStatusRepository extends BaseRepository<ChatChannelStatus> {
  constructor(dataSource: DataSource) {
    super(ChatChannelStatus, dataSource);
  }
}
