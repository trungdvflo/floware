import { Injectable } from '@nestjs/common';
import { DataSource, EntityTarget, Repository, SelectQueryBuilder } from 'typeorm';
import { IPagination } from '../../interface/pagination.interface';
import { PAGING } from '../constant';

@Injectable()
export class BaseRepository<T> extends Repository<T> {
  constructor(entity: EntityTarget<T>, dataSource: DataSource) {
    super(entity, dataSource.createEntityManager());
  }

  async startTransaction() {
    this.manager.queryRunner.startTransaction();
  }

  async commitTransaction() {
    this.manager.queryRunner.commitTransaction();
  }

  async rollbackTransaction() {
    this.manager.queryRunner.rollbackTransaction();
  }

  async release() {
    this.manager.queryRunner.release();
  }

  async pagination(query: SelectQueryBuilder<T>, pagination: IPagination) {
    const page = (pagination?.page || PAGING.DEFAULT_PAGE) - 0;
    const limit = (pagination?.limit || PAGING.DEFAULT_LIMIT) - 0;
    const offset = page > 0 ? (page - 1) * limit : 0;
    query.limit(limit);
    query.offset(offset);
    const items = await query.getRawMany();
    const total = await query.getCount();
    return { items, meta: { total, limit, page } };
  }
}
