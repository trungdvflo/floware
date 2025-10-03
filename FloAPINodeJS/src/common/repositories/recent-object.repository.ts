import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { GetRecentObjectDto } from '../../modules/recent-object/dto/get-recent-object.dto';
import { RecentObjectDto, RecentObjectResponse } from '../../modules/recent-object/dto/recent-object.dto';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { RecentObject } from '../entities/recent-object.entity';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../utils/date.util';

@Injectable()
@CustomRepository(RecentObject)
export class RecentObjectRepository extends Repository<RecentObject> {
  async get(getRecentObjectDto: GetRecentObjectDto, userId: number)
    : Promise<RecentObject[]> {
    const { page_size, min_id, ids, object_type } = getRecentObjectDto;
    const query = this.createQueryBuilder('ro')
      .where('ro.user_id = :userId', { userId })
      .orderBy('updated_date', 'DESC')
      .take(page_size);

    if (min_id) {
      query.andWhere('ro.id > :min_id', { min_id });
    }

    if (ids) {
      query.andWhere('ro.id IN (:...ids)', { ids });
    }

    if (object_type) {
      query.andWhere('ro.object_type = :object_type', { object_type });
    }

    return query.getMany();
  }

  async batchUpsert(recentObjects: RecentObjectDto[], userId: number) {
    const currentTime = getUtcMillisecond();
    const entities: RecentObjectResponse[] = [];
    await Promise.all(recentObjects.map(async (item, idx) => {
      const existedEntity =
        await this.findOne({
          where: {
            user_id: userId,
            object_uid: item.object_uid,
            account_id: item.account_id
          },
          select: ['user_id', 'id']
        });
      const dateItem = getUpdateTimeByIndex(currentTime, idx);

      if (existedEntity) {
        await this.update({ id: existedEntity.id, user_id: existedEntity.user_id },
          this.create({
            user_id: existedEntity.user_id,
            object_href: item.object_href,
            recent_date: item.recent_date,
            updated_date: dateItem
          }));
        // const [row] = await this.findByIds([{ id: existedEntity.id }]);
        const [row] = await this.findBy({ id: existedEntity.id });
        entities.push({ ...row, updated_date: dateItem, ref: item.ref });
      } else {
        const row = await this.save(this.create({
          user_id: userId,
          object_uid: item.object_uid,
          object_type: item.object_type,
          object_href: item.object_href,
          account_id: item.account_id,
          recent_date: item.recent_date ? item.recent_date : dateItem,
          created_date: dateItem,
          updated_date: dateItem
        }));
        entities.push({ ...row, ref: item.ref });
      }
    }));
    return entities;
  }
}