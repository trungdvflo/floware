import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { DestinationsDto } from '../../modules/manual-rule/dtos/manual-rule.post.dto';
import { IS_TRASHED } from '../constants';
import { CustomRepository } from '../decorators/typeorm-ex.decorator';
import { Collection } from '../entities/collection.entity';
import { RuleEntity } from '../entities/manual-rule.entity';

@Injectable()
@CustomRepository(RuleEntity)
export class RuleRepository extends Repository<RuleEntity> {

  async checkExistCollection(destinations: DestinationsDto[], userId: number): Promise<boolean> {
    let isExist: boolean = true;
    const colIds = destinations.map(d => d.collection_id).filter(Boolean);
    if (colIds.length > 0) {
      const cols: Collection[] = await this.manager.createQueryBuilder()
      .select(['id','is_trashed'])
      .from(Collection, 'c')
      .where("c.id IN (:...colIds)", { colIds })
      .andWhere("c.user_id = :userId", { userId })
      .andWhere("c.is_trashed = :isTrashed", { isTrashed: IS_TRASHED.NOT_TRASHED })
      .getRawMany();
      const colIdDbs = cols.map(c => c.id);
      colIds.forEach(colId => {
        if (!colIdDbs.includes(colId)) isExist = false;
      });
    }

    return isExist;
  }

  async findByCollection(userId: number, colIds: number[]) {
    const rules: RuleEntity[] = await this.find({
      where: { user_id: userId }
    });
    return this.filterCollection(rules, colIds);
	}

  filterCollection(rules: RuleEntity[], colIds: number[]): RuleEntity[] {
    const res: RuleEntity[] = [];
    rules.forEach(rule => {
      const dests = [];
      if (rule.destinations) {
        rule.destinations.forEach(dest => {
          if (colIds.includes(dest.collection_id)) {
            dests.push(dest);
          }
        });
      }
      if (dests.length > 0) {
        rule.destinations = dests;
        res.push(rule);
      }
    });
    return res;
  }
}
