import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { CalendarObjectEntity } from "../models/calendar-object.entity";
import { LinkedCollectionObjectEntity } from "../models/linked-collection-object.entity";
import { NoteEntity } from "../models/note.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(NoteEntity)
export class NoteRepository extends BaseRepository<NoteEntity> {
  getAllNoteObjUid(uid: Buffer, userId: number) {
    const parseUidToString = Buffer.from(uid).toString();
    return this.createQueryBuilder('ct')
      .select([
        'ct.uid as uid', 'ct.calendarid as calendarid', 'ct.uri as uri', 'co.calendardata as oldCalendarData'
        ,'COUNT(*) as linkedCount','"VJOURNAL" as objectType', 'GROUP_CONCAT(lco.collection_id) as linked'])
      .innerJoin(CalendarObjectEntity, 'co', 'co.calendarid = ct.calendarid and co.uid = ct.uid')
      .leftJoin(LinkedCollectionObjectEntity, 'lco', 'lco.object_uid = ct.uid')
      .where('lco.user_id = :userId', { userId })
      .andWhere('lco.object_uid = :uid', { uid: parseUidToString })
      .groupBy('ct.id')
      .getRawMany();
  }

  getAllNoteByUri(calUri: string, userId: number) {
    return this.createQueryBuilder('ct')
      .select([
        'ct.uid as uid', 'ct.calendarid as calendarid', 'ct.uri as uri', 'co.calendardata as oldCalendarData'
        ,'COUNT(*) as linkedCount','"VJOURNAL" as objectType', 'GROUP_CONCAT(lco.collection_id) as linked'])
      .innerJoin(CalendarObjectEntity, 'co', 'co.calendarid = ct.calendarid and co.uid = ct.uid')
      .leftJoin(LinkedCollectionObjectEntity, 'lco', 'lco.object_uid = ct.uid')
      .where('lco.user_id = :userId', { userId })
      .andWhere('lco.object_href like :calendarUri', { calendarUri:`${calUri}%` })
      .groupBy('ct.id')
      .getRawMany();
  }
}