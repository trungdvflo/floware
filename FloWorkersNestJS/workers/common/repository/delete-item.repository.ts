import { Injectable } from "@nestjs/common";
import { GENERATE_DELETED_ITEM_FOR_SHARED } from "../constants/mysql.constant";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { IDeleteByCollection } from "../interface/api-last-modify.interface";
import { IDeleteObjectNoUid, IDeleteObjectUid } from "../interface/links-object.interface";
import { DeletedItemEntity } from "../models/deleted-item.entity";
import { getPlaceholderByN } from "../utils/common";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(DeletedItemEntity)
export class DeleteItemRepository extends BaseRepository<DeletedItemEntity> {
  async createDeleteItemNoUid(itemDelete: IDeleteObjectNoUid): Promise<boolean> {
    await this.insert(this.createDeletedItemEntityNoUid(itemDelete));
    return true;
  }

  async createDeleteItem(itemDelete: IDeleteObjectUid): Promise<boolean> {
    await this.insert(this.createDeletedItemEntity(itemDelete));
    return true;
  }

  createDeletedItemEntityNoUid(itemDelete: IDeleteObjectNoUid)
    : DeletedItemEntity {
    return this.create({
      user_id: itemDelete.user_id,
      item_id: itemDelete.item_id,
      item_type: itemDelete.item_type,
      created_date: itemDelete.updated_date,
      updated_date: itemDelete.updated_date
    });
  }

  createDeletedItemEntity(itemDelete: IDeleteObjectUid):
    DeletedItemEntity {
    return this.create({
      user_id: itemDelete.user_id,
      item_id: itemDelete.item_id,
      item_uid: itemDelete.item_uid,
      item_type: itemDelete.item_type,
      created_date: itemDelete.updated_date,
      updated_date: itemDelete.updated_date
    });
  }

  async generateDeletedItemForSharedCollection({
    itemType
    , collectionId
    , itemId
    , deleteDate }: IDeleteByCollection) {
    try {
      if (!collectionId) {
        return 0;
      }
      const { spName, spParam } = GENERATE_DELETED_ITEM_FOR_SHARED;
      const saved = await this.manager
        .query(`SELECT ${spName}(${getPlaceholderByN(spParam)}) id`, [
          itemType,
          collectionId,
          itemId,
          deleteDate
        ]);
      return saved[0];
    } catch (error) {
      return { error };
    }
  }
}