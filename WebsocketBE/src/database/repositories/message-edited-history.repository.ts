import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MessageEditedHistory } from '../entities/message-edited-history.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class MessageEditedHistoryRepository extends BaseRepository<MessageEditedHistory> {
  constructor(dataSource: DataSource) {
    super(MessageEditedHistory, dataSource);
  }
}
