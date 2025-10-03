import { Injectable } from "@nestjs/common";
import { FindOptionsWhere } from "typeorm";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { CalendarObjectEntity } from "../models/calendar-object.entity";
import { LinkedCollectionObjectEntity } from "../models/linked-collection-object.entity";
import { TodoEntity } from "../models/todo.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(TodoEntity)
export class TodoRepository extends BaseRepository<TodoEntity> {
  async getFullItemByConditions(conditions: FindOptionsWhere<TodoEntity>): Promise<TodoEntity> {
    return await this.findOne({ where: conditions});
  }

  getAllTodoByUri(calUri: string, userId: number) {
    return this.createQueryBuilder('ct')
      .select([
        'ct.uid as uid', 'ct.calendarid as calendarid', 'ct.uri as uri', 'co.calendardata as oldCalendarData'
        ,'COUNT(*) as linkedCount','"VTODO" as objectType', 'GROUP_CONCAT(lco.collection_id) as linked'])
      .innerJoin(CalendarObjectEntity, 'co', 'co.calendarid = ct.calendarid and co.uid = ct.uid')
      .leftJoin(LinkedCollectionObjectEntity, 'lco', 'lco.object_uid = ct.uid')
      .where('lco.user_id = :userId', { userId })
      .andWhere('lco.object_href like :calendarUri', { calendarUri:`${calUri}%` })
      .groupBy('ct.id')
      .getRawMany();
  }

  getAllTodoObjUid(uid: Buffer, userId: number) {
    const parseUidToString = Buffer.from(uid).toString();
    return this.createQueryBuilder('ct')
      .select([
        'ct.uid as uid', 'ct.calendarid as calendarid', 'ct.uri as uri', 'co.calendardata as oldCalendarData'
        ,'COUNT(*) as linkedCount','"VTODO" as objectType', 'GROUP_CONCAT(lco.collection_id) as linked'])
      .innerJoin(CalendarObjectEntity, 'co', 'co.calendarid = ct.calendarid and co.uid = ct.uid')
      .leftJoin(LinkedCollectionObjectEntity, 'lco', 'lco.object_uid = ct.uid')
      .where('lco.user_id = :userId', { userId })
      .andWhere('lco.object_uid = :uid', { uid: parseUidToString })
      .groupBy('ct.id')
      .getRawMany();
  }
}