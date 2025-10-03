import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MessageAttachment } from '../entities/message-attachment.entity';
import { MessageChannel } from '../entities/message-channel.entity';
import { Message } from '../entities/message.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class MessageAttachmentRepository extends BaseRepository<MessageAttachment> {
  constructor(dataSource: DataSource) {
    super(MessageAttachment, dataSource);
  }

  async getMesageAttachmentsFromChannel(channel: string) {
    const selectFields = [
      'attachment.message_uid message_uid',
      'attachment.file_id file_id',
      'attachment.created_date created_date',
      'attachment.updated_date updated_date',
      'm.from `owner`',
    ];
    const query = this.createQueryBuilder('attachment').select(selectFields);

    query.innerJoin(MessageChannel, 'mc', `mc.message_uid = attachment.message_uid`);
    query.where(`mc.channel_name = :channel`, { channel });

    query.leftJoin(Message, 'm', `m.uid = attachment.message_uid`);

    const rs = await query.getRawMany();
    return rs;
  }
}
