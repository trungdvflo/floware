import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { RuleEntity } from "../models/rule.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(RuleEntity)
export class RuleRepository extends BaseRepository<RuleEntity> {

  async deleteByCollection(userId: number, colId: number) {
    await this.manager.query(`
      DELETE FROM rule
      WHERE user_id = ? AND destinations->>"$[0].collection_id" = ?
    `, [userId, colId]);
	}
}