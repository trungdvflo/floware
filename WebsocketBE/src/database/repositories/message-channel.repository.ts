import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MessageChannel } from '../entities/message-channel.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class MessageChannelRepository extends BaseRepository<MessageChannel> {
  constructor(dataSource: DataSource) {
    super(MessageChannel, dataSource);
  }
}
