import { getRepository, In } from 'typeorm';
import { CalendarChange } from '../entities/calendar-change.entity';

export class CalendarChangeService {
  private readonly repo = getRepository(CalendarChange);

  /**
   * Delete items by calendar id
   * @param listId
   * @returns
   */
  deleteByCalendarId(listId: number[]) {
    return this.repo.delete({ calendarid: In(listId) });
  }
}
