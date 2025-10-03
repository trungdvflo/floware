import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { In } from 'typeorm/find-options/operator/In';
import { DELETED_ITEM_TYPE } from '../../common/constants/common';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { DeletedItem } from '../../common/entities/deleted-item.entity';
import { IDeleteItem } from '../../common/interfaces/delete-item.interface';
import { filterGetAllFields } from "../../common/utils/typeorm.util";
import { DeleteItemParam } from './dto/deletedItemParam';

@Injectable()
export class DeletedItemService {
  constructor(
    // we create a repository for the Collection entity
    // and then we inject it as a dependency in the service
    @InjectRepository(DeletedItem) private readonly deletedItem: Repository<DeletedItem>,
  ) { }
  // this method retrieves all entries
  async findAll(userId: number, itemType: DELETED_ITEM_TYPE | DELETED_ITEM_TYPE[]
    , filter?: GetAllFilter<DeletedItem>, isRecovery?: number) {
    const { modified_gte, modified_lt, ids, page_size } = filter;
    const aliasName = this.deletedItem.metadata.name;
    const fields = filterGetAllFields(this.deletedItem, filter.fields);
    // TODO: comment code because it make 2 bugs FB-2178 and FB-2188
    // const allDeletedField: string[] = [
    //   'id', 'user_id', 'item_id', 'item_uid', 'item_type',
    //   'is_recovery', 'created_date', 'updated_date'
    // ];
    // const deletedFields: string[] = allDeletedField
    //   .filter(f => !fields ? true : fields.map(String).includes(f))
    //   .map((f: string) => {
    //     return ['created_date', 'updated_date'].includes(f)
    //       ? `ifnull(max(${aliasName}.${f}),0) as ${aliasName}_${f}`
    //       : `${aliasName}.${f} as ${f}`;
    //   });

    let query = this.deletedItem
      .createQueryBuilder(aliasName)
      .select(fields && fields.map(f => `${aliasName}.${String(f)}`))
      // .addSelect(deletedFields)
      .where(`${aliasName}.user_id = :userId`, { userId });

    if (Array.isArray(itemType)) {
      query.andWhere(`${aliasName}.item_type IN (:...itemType)`, { itemType });
    } else {
      query.andWhere(`${aliasName}.item_type = :itemType`, { itemType });
    }

    if (modified_lt) {
      query = query.andWhere(`${aliasName}.updated_date < :modified_lt`, { modified_lt });
    }
    if (modified_gte) {
      query = query.andWhere(`${aliasName}.updated_date >= :modified_gte`, { modified_gte });
    }
    // not used
    // if (min_id) {
    //   query = query.andWhere(`${aliasName}.item_id > :min_id`, { min_id });
    // }
    if (ids) {
      query = query.andWhere(`${aliasName}.item_id IN (:...ids)`, { ids });
    }

    if (isRecovery) {
      query = query.andWhere(`${aliasName}.is_recovery = :isRecovery`, { isRecovery });
    }

    query.groupBy(`${aliasName}.item_id`);
    query.addGroupBy(`${aliasName}.item_uid`);
    query.addGroupBy(`${aliasName}.user_id`);
    query.addGroupBy(`${aliasName}.item_type`);
    query.orderBy(`${aliasName}.updated_date`, 'ASC');
    query.addOrderBy(`${aliasName}.id`, 'DESC');

    const items = await query.limit(page_size).getMany();
    return Array.isArray(itemType)
      ? items
      : items.map(item => {
        delete item.item_type;
        return item;
      });

  }
  // this method retrieves only one entry, by entry ID
  async findOneById(userId: number, id: number) {
    return await this.deletedItem.findOne({
      where: {
        id,
        user_id: userId
      }
    });
  }
  // this method retrieves only one entry, by entry ID
  async findOneByItemId(user_id: number, item_id: number, item_type: string) {
    return await this.deletedItem.findOne({
      where: {
        item_id,
        user_id,
        item_type
      }
    });
  }
  async findByItemIds(userId: number, itemType: string, ids: number[]) {
    return await this.deletedItem.find({
      where: {
        user_id: userId,
        item_id: In(ids),
        item_type: itemType
      }
    });
  }

  // this method retrieves only one entry, by entry ID
  async findOneByUid(userId: number, itemType: string, uid: string) {
    return await this.deletedItem.findOne({
      where: {
        user_id: userId,
        item_uid: uid,
        item_type: itemType
      }
    });
  }

  // this method retrieves only one entry, by entry ID
  async findByUids(userId: number, itemType: string, uids: string[]) {
    return await this.deletedItem.find({
      where: {
        user_id: userId,
        item_uid: In(uids),
        item_type: itemType
      }
    });
  }
  // this method saves an entry in the database
  async create(user_id: number, deletedItemParam: DeleteItemParam) {
    const colEntity = this.deletedItem.create({
      user_id,
      ...deletedItemParam
    });
    const itemRespond = await this.deletedItem.save(colEntity);
    return itemRespond;
  }

  // this method saves array entry in the database
  async createMultiple(deletedItems: IDeleteItem[]) {
    if (deletedItems.length <= 0) return;
    const itemRespond = await this.deletedItem.insert(deletedItems);
    return itemRespond;
  }

  async batchCreateWithDate(userId: number, deletedItemParams: DeleteItemParam[]) {
    return (await Promise.all(deletedItemParams.map(async (deletedItemParam, index) => {
      return this.create(userId, deletedItemParam);
    }))).filter(Boolean);
  }

  async findMaxUpdatedDate(user_id: number, item_type: string) {
    const query = this.deletedItem.createQueryBuilder("d")
      .select("MAX(d.updated_date)", "max_updated_date")
      .where("d.user_id = :userId", { userId: user_id })
      .andWhere("d.item_type = :itemType", { itemType: item_type});
    const rs = await query.getRawOne();

    return rs?.max_updated_date? rs.max_updated_date : 0;
  }
}