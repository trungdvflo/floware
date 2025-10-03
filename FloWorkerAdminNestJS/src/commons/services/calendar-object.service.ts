import { getConnection, getRepository, In, Repository } from 'typeorm';

import { CalendarObject } from '../entities/calendar-object.entity';
import { CalendarInstance } from '../entities/calendar-instance.entity';

import { CALDAV_OBJ_TYPE } from '../constants/constant';

export interface CalendarObjectServiceOptions {
  fields: (keyof CalendarObject)[];
}

export class CalendarObjectService {
  private readonly calendarObject: Repository<CalendarObject> = getRepository(CalendarObject);

  async findOneByUid(
    uid: string,
    componentType: CALDAV_OBJ_TYPE,
    selectedFields?: (keyof CalendarObject)[]
  ) {
    return this.calendarObject.findOne({
      select: selectedFields,
      where: {
        uid,
        componenttype: componentType
      }
    });
  }

  async callCaldavSize(principaluri: string) {
    const saved = await this.calendarObject
      .createQueryBuilder('c2')
      .select(`IFNULL(SUM(CASE WHEN c2.componenttype = 'VEVENT' THEN c2.size END), 0) AS VEVENT,
               IFNULL(SUM(CASE WHEN c2.componenttype = 'VTODO' THEN c2.size END), 0) AS VTODO, 
               IFNULL(SUM(CASE WHEN c2.componenttype = 'VJOURNAL' THEN c2.size END), 0) AS VJOURNAL`)
      .leftJoin(CalendarInstance, 'c', ' c.calendarid = c2.calendarid ')
      .where('c.principaluri = :principaluri', { principaluri })
      .getRawMany();
    return saved.length ? saved[0] : {};
  }

  async findAllByCalendarUri(listID: number[], options?: CalendarObjectServiceOptions) {
    if (!listID.length) return [];
    return this.calendarObject
      .createQueryBuilder('calendarobject')
      .select(options?.fields.map((f) => `calendarobject.${f}`))
      .addSelect('SUM(calendarobject.componenttype)', 'size')
      .where('calendarobject.calendarid IN(:...uri)', { uri: listID })
      .groupBy(options?.fields.map((f) => `calendarobject.${f}`).toString())
      .getRawMany();
  }

  /**
   * Delete items by calendar id
   * @param listId
   * @returns
   */
  deleteByCalendarId(listId: number[]) {
    return this.calendarObject.delete({ calendarid: In(listId) });
  }
}
