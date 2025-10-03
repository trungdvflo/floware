import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MessageChannelSent } from '../entities/message-channel-sent.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class MessageChannelSentRepository extends BaseRepository<MessageChannelSent> {
  constructor(dataSource: DataSource) {
    super(MessageChannelSent, dataSource);
  }
}
