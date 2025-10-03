import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChannelUserLastSeen } from '../entities/channel-user-last-seen.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class ChannelUserLastSeenRepository extends BaseRepository<ChannelUserLastSeen> {
  constructor(dataSource: DataSource) {
    super(ChannelUserLastSeen, dataSource);
  }

  async increaUnread(channel: string) {
    await this.createQueryBuilder()
      .update(ChannelUserLastSeen)
      .set({ unread: () => 'unread + 1' })
      .where('channel_name = :channel', { channel })
      .execute();
  }

  async resetRemine(channel: string) {
    await this.createQueryBuilder()
      .update(ChannelUserLastSeen)
      .set({ remine: 0 })
      .where('channel_name = :channel', { channel })
      .execute();
  }
}
