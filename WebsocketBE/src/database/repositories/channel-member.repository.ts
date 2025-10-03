import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ChannelMember } from '../entities/channel-member.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class ChannelMemberRepository extends BaseRepository<ChannelMember> {
  constructor(dataSource: DataSource) {
    super(ChannelMember, dataSource);
  }
}
