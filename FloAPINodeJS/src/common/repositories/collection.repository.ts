import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { Collection } from '../entities/collection.entity';
import { CollectionOptionsInterface } from '../interfaces/collection.interface';
const aliasName = 'c';
@Injectable()
@CustomRepository(Collection)
export class CollectionRepository extends Repository<Collection> {
  async findOnMasterByUids(ids: number[], userId: number) {
    const masterQueryRunner = this.manager.connection.createQueryRunner('master');
    try {
      const listCollection = await this.createQueryBuilder()
        .setQueryRunner(masterQueryRunner).where({
          id: In(ids),
          user_id: userId
        }).getMany();
      return listCollection;
    } finally {
      await masterQueryRunner.release();
    }
  }

  async findAllOnMaster(options: CollectionOptionsInterface) {
    const masterQueryRunner = this.manager.connection.createQueryRunner('master');
    try {
      const collectionItem = await this.createQueryBuilder(aliasName)
        .setQueryRunner(masterQueryRunner)
        .select(options.fields)
        .where(options.conditions).getRawMany();
      return collectionItem;
    } finally {
      await masterQueryRunner.release();
    }
  }

  async findOneOnMaster(options: CollectionOptionsInterface) {
    const masterQueryRunner = this.manager.connection.createQueryRunner('master');
    try {
      const collectionItem = await this.createQueryBuilder(aliasName)
        .setQueryRunner(masterQueryRunner)
        .select(options.fields)
        .where(options.conditions).getRawOne();
      return collectionItem;
    } finally {
      await masterQueryRunner.release();
    }
  }

  updateRealtimeChannel(realtime_channel: string, collectionId: number) {
    return this.update(collectionId, { realtime_channel });
  }
}