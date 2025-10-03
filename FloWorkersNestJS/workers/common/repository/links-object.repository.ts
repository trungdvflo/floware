import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { GetOptionInterface } from "../interface/typeorm.interface";
import { LinkedObjectEntity } from "../models/linked-object.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(LinkedObjectEntity)
export class LinksObjectRepository extends BaseRepository<LinkedObjectEntity> {
  async findAllByUid(options: GetOptionInterface<LinkedObjectEntity>):
    Promise<LinkedObjectEntity[]> {
    const { fields, conditions } = options;
    return this.createQueryBuilder()
      .select(fields)
      .where(`user_id = :userId AND ((source_object_type = :objectType AND source_object_uid = :objectUid) OR (destination_object_type = :objectType AND destination_object_uid = :objectUid))`,
        {
          userId: conditions['user_id'],
          objectType: conditions['object_type'],
          objectUid: conditions['object_uid']
        }).getRawMany();
  }
}