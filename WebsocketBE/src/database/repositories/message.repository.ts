import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MessageFilter, Status, Type } from '../../interface/message.interface';
import { IPagination } from '../../interface/pagination.interface';
import { DatabaseName } from '../constant';
import { Channel } from '../entities';
import { MessageChannel } from '../entities/message-channel.entity';
import { MessageUserStatus } from '../entities/message-user-status.entity';
import { Message } from '../entities/message.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class MessageRepository extends BaseRepository<Message> {
  constructor(dataSource: DataSource) {
    super(Message, dataSource);
  }

  // get chat message by message_uid and join with channel by channel_name
  async getChatMessageByUid(message_uid: string) {
    const [msg, channel] = ['msg', 'channel'];
    const message = await this.createQueryBuilder(msg)
    .select([
      `${msg}.id id`,
      `${msg}.uid uid`,
      `${msg}.content content`,
      `${msg}.from \`from\``,
      `${msg}.metadata metadata`,
      `${msg}.sent_time sent_time`,

      `${msg}.created_date created_date`,
      `${msg}.updated_date updated_date`,
      `${msg}.deleted_date deleted_date`,

      `${msg}.parent_uid parent_uid`,
      `${msg}.content_marked content_marked`,
      `${msg}.message_marked message_marked`,

      `${msg}.to_channel to_channel`,
      `${msg}.type type`,
      `${msg}.status status`,
      `${channel}.internal_channel_id channel_id`,
      `${channel}.type channel_type`,
    ])
    .innerJoin(Channel, channel, `${channel}.name = ${msg}.to_channel`)
    .where(`${msg}.uid = :message_uid`, { message_uid })
    .getRawOne();

    return {
      ...message,
      channel_id: message?.channel_id,
    };
  }

  async getChatMessages(filter: MessageFilter, pagination: IPagination) {
    const {
      type,
      status,
      channel,
      after_sent_time,
      before_sent_time,
      order_by_sent_time,
      parent_uid,
    } = filter;
    const [child, msg] = ['child', 'msg'];
    const query = this.createQueryBuilder(msg)
      .select([
        `${msg}.uid uid`,
        `${msg}.content content`,
        `${msg}.from \`from\``,
        `${msg}.metadata metadata`,

        // in case of reply, quote, forward
        `${msg}.parent_uid parent_uid`,
        `${msg}.content_marked content_marked`,
        `${msg}.message_marked message_marked`,

        `${msg}.deleted_date deleted_date`,
        `${msg}.created_date created_date`,
        `${msg}.updated_date updated_date`,

        // number of replied message in case of reply
        `COUNT(${child}.uid) reply_number`,
      ]);

    if (type) {
      query.andWhere(`${msg}.type = :type`, { type });
    }

    if (after_sent_time) {
      query.andWhere(`${msg}.created_date > :after_sent_time`, { after_sent_time });
    }

    if (before_sent_time) {
      query.andWhere(`${msg}.created_date < :before_sent_time`, { before_sent_time });
    }

    if (status) {
      query.andWhere(`${msg}.status = :status`, { status });
    }

    if (channel) {
      query.andWhere(`${msg}.to_channel = :channel`, { channel });
    }

    if (order_by_sent_time?.toLowerCase() === 'asc') {
      query.orderBy(`${msg}.created_date`, 'ASC');
    } else {
      query.orderBy(`${msg}.created_date`, 'DESC');
    }

    if (parent_uid) { // replied message
      query.andWhere(`${msg}.parent_uid = :parent_uid`, { parent_uid });
    } else { // normal chat message
      query.andWhere(`ifnull(${msg}.parent_uid, '') = ''`);
    }

    query.leftJoin(`${DatabaseName.REALTIME_MESSAGE}`, child,
      `${child}.parent_uid = ${msg}.uid and ${child}.to_channel = ${msg}.to_channel`)
      .groupBy(`${msg}.uid`);

    return await this.pagination(query, pagination);
  }

  async getNotificationMessages(filter: MessageFilter, pagination: IPagination) {
    let { status } = filter;
    const { email, channel } = filter;
    // convert to int
    status = status - 0;
    const select = [
      'message.uid uid',
      'message.content content',
      'message.from `from`',
      'message.metadata metadata',
      'message.deleted_date deleted_date',
      'message.created_date created_date',
      'message.updated_date updated_date',
    ];
    const query = this.createQueryBuilder('message').select(select);
    query.andWhere(`message.type = :type`, { type: Type.NOTIFICATION });

    if (status === Status.read || status === Status.unsent) {
      query.leftJoin(MessageUserStatus, 'ms', 'ms.message_uid = message.uid');
      query.andWhere(`ms.status = :status`, { status });
      query.andWhere(`ms.email = :email`, { email });
    }

    if (status === Status.unread) {
      query.leftJoin(
        MessageUserStatus,
        'ms',
        `ms.message_uid = message.uid and ms.email = '${email}' and ms.status = ${Status.read}`
      );
      query.andWhere(`ms.status is null`);
    }

    if (status === Status.sent) {
      query.leftJoin(
        MessageUserStatus,
        'ms',
        `ms.message_uid = message.uid and ms.email = '${email}' and ms.status = ${Status.unsent}`
      );
      query.andWhere(`ms.status is null`);
    }

    if (channel) {
      query.innerJoin(MessageChannel, 'mc', `mc.message_uid = message.uid`);
      query.andWhere(`mc.channel_name = :channel`, { channel });
    }

    query.orderBy('message.created_date', 'DESC');

    return await this.pagination(query, pagination);
  }
}
