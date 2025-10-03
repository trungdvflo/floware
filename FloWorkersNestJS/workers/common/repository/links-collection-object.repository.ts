import { Injectable } from "@nestjs/common";
import { GENERATE_DELETED_ITEM_FOR_MEMBER } from "../constants/mysql.constant";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { IDeleteObjectMember } from "../interface/links-object.interface";
import { LinkedCollectionObjectEntity } from "../models/linked-collection-object.entity";
import { getPlaceholderByN } from "../utils/common";
import { BaseRepository } from "./base.repository";
@Injectable()
@CustomRepository(LinkedCollectionObjectEntity)
export class LinksCollectionObjectRepository extends BaseRepository<LinkedCollectionObjectEntity> {
  async generateDeletedItemForShared({
    collection_link_id, collection_id, updated_date
  }: IDeleteObjectMember) {
    try {
      if (!collection_id || !collection_link_id) {
        return 0;
      }
      const { spName, spParam } = GENERATE_DELETED_ITEM_FOR_MEMBER;
      const saved = await this.manager
        .query(`SELECT ${spName}(${getPlaceholderByN(spParam)}) id`, [
          'COLLECTION_LINK_MEMBER',
          collection_id,
          collection_link_id,
          updated_date
        ]);
      return saved[0];
    } catch (error) {
      return { error };
    }
  }
}