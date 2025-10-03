import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuerySearch } from '../../channel/channel-param.request';
import { IPagination } from '../../interface/pagination.interface';
import { ChannelMember } from '../entities/channel-member.entity';
import { Channel } from '../entities/channel.entity';
import { BaseRepository } from './base.repository';
@Injectable()
export class ChannelRepository extends BaseRepository<Channel> {
  constructor(dataSource: DataSource) {
    super(Channel, dataSource);
  }

  async getChannelByEmail(email: string) {
    const selectFields = ['channel.name name'];
    let query = this.createQueryBuilder('channel').select(selectFields);

    query = query
      .innerJoin(ChannelMember, 'member', `channel.id = member.channel_id`)
      .where(`member.email = :email`, { email })
      .andWhere(`member.revoke_date IS NULL`);

    const rs = await query.getRawMany();
    return rs;
  }

  async getChannels(email: string, filter: QuerySearch, pagination: IPagination) {
    const { type, internal_channel_id } = filter;

    let query = this.createQueryBuilder('channel').select([
      'channel.name as name',
      'channel.type as type',
      'channel.title as title',
      'channel.internal_channel_id as internal_channel_id',
    ]);

    query = query.innerJoin(ChannelMember, 'member', `channel.id = member.channel_id`);
    query.andWhere(`member.email = :email`, { email });

    if (type) {
      query.andWhere(`channel.type = :type`, { type });
    }

    if (internal_channel_id) {
      query.andWhere(`channel.internal_channel_id = :internal_channel_id`, { internal_channel_id });
    }

    return this.pagination(query, pagination);
  }
}
