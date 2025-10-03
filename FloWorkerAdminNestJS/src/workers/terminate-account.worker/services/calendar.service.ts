import { getConnection, getRepository } from 'typeorm';

import { Calendar } from '../entities/calendar.entity';
import { CalendarInstance } from '../../../commons/entities/calendar-instance.entity';

export class TableNames {
  cal_event;
  cal_note;
  cal_todo;
  calendarchanges;
  calendarinstances;
  calendarobjects;
  calendars;
  calendarsubscriptions;
  calling_history;
  card_contact;
  cards;
}
export interface CalendarServiceOptions {
  fields: (keyof Calendar)[];
}
export class CalendarService {
  private readonly calendar = getRepository(Calendar);
  async findOneByCalendarUri(calUri: string, options?: CalendarServiceOptions) {
    return this.calendar
      .createQueryBuilder('calendar')
      .select(options?.fields.map((f) => `calendar.${f}`))
      .innerJoin(CalendarInstance, 'calendarinstance', 'calendarinstance.calendarid = calendar.id')
      .where('calendarinstance.uri = :uri', { uri: calUri })
      .getOne();
  }

  /**
   * Delete items by calendar id
   * @param listId
   * @returns
   */
  deleteById(listId: number[]) {
    return this.calendar.delete(listId);
  }

  /**
   * Delete from table by list calendar id
   * @param calendarIds
   * @param tableName
   * @returns
   */
  deleteByCalendarId(calendarIds: number[], tableName: keyof TableNames) {
    return getConnection()
      .createQueryBuilder()
      .delete()
      .from(tableName)
      .where("calendarid IN (:...calendarIds)", { calendarIds })
      .execute();
  }
}
