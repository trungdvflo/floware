import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { GetOptionInterface } from "../interface/typeorm.interface";
import { ContactHistoryEntity } from "../models/contact-history.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(ContactHistoryEntity)
export class ContactHistoryRepository extends BaseRepository<ContactHistoryEntity> {
  async findItemByUid(options: GetOptionInterface<ContactHistoryEntity>) {
    const { fields, conditions } = options;
    return this.createQueryBuilder().select(fields)
      .where(`user_id = :userId AND ((source_object_type = :objectType AND source_object_uid = :objectUid) OR (destination_object_type = :objectType AND destination_object_uid = :objectUid))`,
        {
          userId: conditions['user_id'],
          objectType: conditions['object_type'],
          objectUid: conditions['object_uid']
        }).getRawMany();
  }

  async getContactHistories(accountIds: number[], userId: number)
    : Promise<ContactHistoryEntity[] | any> {
    try {
      return await this.manager.createQueryBuilder(ContactHistoryEntity, 'ch')
        .select(['id'])
        .where('ch.user_id = :userId', { userId })
        .andWhere(`ch.destination_account_id IN (:...accountIds)
                    or source_account_id IN (:...accountIds)`, { accountIds })
        .getRawMany();
    } catch (error) {
      return { error };
    }
  }
}