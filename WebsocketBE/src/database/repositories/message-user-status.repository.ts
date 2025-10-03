import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { LoggerService } from '../../common/logger/logger.service';
import { Status } from '../../interface/message.interface';
import { MessageUserStatus } from '../entities/message-user-status.entity';
import { Message } from '../entities/message.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class MessageUserStatusRepository extends BaseRepository<MessageUserStatus> {
  constructor(dataSource: DataSource) {
    super(MessageUserStatus, dataSource);
  }

  async getMessageUnsent(email: string) {
    try {
      const selectFields = [
        'm.uid uid',
        'm.code code',
        'm.content content',
        'm.from `from`',
        'm.metadata metadata',
        'm.send_type send_type',
        'm.to_channel to_channel',
        'm.qos qos',
        'm.delay delay',
        'm.status status',
        'm.type type',
        'm.created_date as created_date',
      ];
      const query = this.createQueryBuilder('ms').select(selectFields);
      query.where('ms.status = :status', { status: Status.unsent });
      query
        .innerJoin(Message, 'm', `m.uid = ms.message_uid`)
        .where(`ms.email = :email`, { email })
        .andWhere('m.qos = 1');

      const rs = await query.getRawMany();
      return rs;
    } catch (e) {
      LoggerService.getInstance().logError(e);
      return [];
    }
  }
}
