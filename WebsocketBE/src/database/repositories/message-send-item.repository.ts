import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { MessageSendItem } from '../entities/message-send-item.entity';

@Injectable()
export class MessageSendItemRepository extends Repository<MessageSendItem> {}
