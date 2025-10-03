import { Injectable } from "@nestjs/common";
import { DELETE_ACTIVITY_BY_UID } from "../constants/mysql.constant";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { TrashEntity } from "../models/trash.entity";
import { getPlaceholderByN } from "../utils/common";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(TrashEntity)
export class TrashRepository extends BaseRepository<TrashEntity> {

  async deleteActivityByUid(object_uid: Buffer, updated_date: number) {
    try {
      const { spName, spParam } = DELETE_ACTIVITY_BY_UID;
      const saved = await this.manager
        .query(`SELECT ${spName}(${getPlaceholderByN(spParam)}) id`, [
          object_uid.toString('utf8'), updated_date
        ]);
      return saved[0];
    } catch (error) {
      return { error };
    }
  }

}