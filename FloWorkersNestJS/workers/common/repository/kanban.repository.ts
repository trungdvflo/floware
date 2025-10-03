import { Injectable } from "@nestjs/common";
import { In } from "typeorm";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { GetOptionInterface } from "../interface/typeorm.interface";
import { KanbanEntity } from "../models/kanban.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(KanbanEntity)
export class KanbanRepository extends BaseRepository<KanbanEntity> {
  async deleteByIds(kanbanIds: number[]): Promise<void> {
    await this.delete({ id: In(kanbanIds) });
  }

  async getMinTable(user_id: number, collection_id: number) {
    const query = await this.createQueryBuilder()
      .select(`MIN(order_number)`, "minColumn")
      .where(`user_id = :user_id`, { user_id })
      .andWhere(`collection_id = :collection_id`, { collection_id })
      .getRawOne();
    const num = query.minColumn;
    return num ? num : 0;
  }

  async getAllKanbanShared({ conditions, fields }:
    GetOptionInterface<KanbanEntity>): Promise<KanbanEntity[]> {
    const kanban = this.manager
      .createQueryBuilder()
      .select(fields.map(f => `k1.${f} as ${f}`))
      .from('KanbanEntity', 'k1')
      .where("k1.collection_id = ?",)
      .andWhere("k1.user_id = ?")
      .getQuery();

    const kanbanMember = this.manager
      .createQueryBuilder()
      .select(fields.map(f => `k.${f} as ${f}`))
      .from('KanbanEntity', 'k')
      .innerJoin('collection_shared_member', "csm",
        "k.collection_id = csm.collection_id")
      .where("csm.collection_id = ?")
      .andWhere("csm.shared_status = 1")
      .andWhere("csm.member_user_id = k.user_id")
      .getQuery();

    return await this.manager.query(`${kanban} UNION ${kanbanMember}`, [
      conditions['collection_id'],
      conditions['user_id'],
      conditions['collection_id']
    ]);
  }
}