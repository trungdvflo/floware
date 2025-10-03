import { getRepository, In } from 'typeorm';
import { CalendarInstance } from '../entities/calendar-instance.entity';
export interface CalendarInstanceServiceOptions {
  fields: (keyof CalendarInstance)[];
}
export class CalendarInstanceService {
  private readonly calendarInstance = getRepository(CalendarInstance);

  async findAllByPrincipalUri(principaluri: string, options?: CalendarInstanceServiceOptions) {
    return this.calendarInstance.find({
      select: options?.fields,
      where: { principaluri }
    });
  }

  /**
   * Delete items by calendar id
   * @param listId
   * @returns
   */
  deleteByCalendarId(listId: number[]) {
    return this.calendarInstance.delete({ calendarid: In(listId) });
  }
}
