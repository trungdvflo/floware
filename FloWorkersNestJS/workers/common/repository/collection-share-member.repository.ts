import { Injectable } from "@nestjs/common";
import { In } from "typeorm";
import { SHARE_STATUS } from "../constants/common.constant";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { ShareMemberEntity } from "../models/share-member.entity";
import { TimestampDouble } from "../utils/common";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(ShareMemberEntity)
export class CollectionShareMemberRepository extends BaseRepository<ShareMemberEntity> {
  async deleteShareMembersByIds(shareMemberIds: number[]): Promise<void> {
    await this.update({ id: In(shareMemberIds) }, {
      shared_status: SHARE_STATUS.TEMP_REMOVE,
      updated_date: TimestampDouble()
    });
  }
}