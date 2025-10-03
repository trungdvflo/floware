import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { CustomRepository } from "../decorators/typeorm-ex.decorator";
import { BaseGetShortcutDTO } from "../dtos/base-get.dto";
import { CollectionIcon } from "../entities/collection-icons.entity";
type GetAllParams = {
  filter: BaseGetShortcutDTO,
  userId: number,
  isDeleted?: boolean
};
@Injectable()
@CustomRepository(CollectionIcon)
export class CollectionIconsRepository extends Repository<CollectionIcon> {
  async getLastModifyDate() {
    const result = await this.createQueryBuilder('ic')
      .select('max(ic.updated_date) updated_date').getRawOne();
    return +result.updated_date || 0;
  }
  async getAllIcons({ filter }: GetAllParams) {
    const { modified_gte, modified_lt, min_id, page_size, fields, ids, shortcut }
      = filter;
    const alias: string = 'ic';

    const fieldMember: string[] = [
      'id', 'shortcut', 'shortcut', 'cdn_url', 'icon_type',
      'description', 'updated_date', 'created_date'
    ].filter(f => !fields ? true : fields.includes(f))
      .map((f: string) => `${alias}.${f} as ${f}`);

    let query = this.createQueryBuilder(alias)
      .select(fieldMember);
    // other null revoke_time | get for my self

    if (modified_lt || modified_lt === 0) {
      query = query.andWhere(`${alias}.updated_date < :modified_lt`, { modified_lt });
      query = query.addOrderBy(`${alias}.updated_date`, "DESC");
    }
    if (modified_gte || modified_gte === 0) {
      query = query.andWhere(`${alias}.updated_date >= :modified_gte`, { modified_gte });
      query = query.addOrderBy(`${alias}.updated_date`, "ASC");
    }
    if (min_id || min_id === 0) {
      query = query.andWhere(`${alias}.id > :min_id`, { min_id });
      query = query.addOrderBy(`${alias}.id`, "ASC");
    }
    if (ids) {
      query = query.andWhere(`${alias}.id IN (:...ids)`, { ids });
    }
    if (shortcut) {
      query = query.andWhere(`${alias}.shortcut = :shortcut`, { shortcut });
    }
    return query.limit(page_size).getRawMany();
  }

}