import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UserUsage } from '../entities/user-usage.entity';
import { BaseRepository } from './base.repository';

@Injectable()
export class UserUsageRepository extends BaseRepository<UserUsage> {
  constructor(dataSource: DataSource) {
    super(UserUsage, dataSource);
  }
}
