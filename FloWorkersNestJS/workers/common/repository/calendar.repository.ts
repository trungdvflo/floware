import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { CalendarEntity } from "../models/calendar.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(CalendarEntity)
export class CalendarRepository extends BaseRepository<CalendarEntity> {
  async createCalendar() {
    const calendar = this.create({
      components: 'VEVENT,VTODO,VJOURNAL,VFREEBUSY,VALARM',
      synctoken: 1
    });
    return await this.save(calendar);
  }
}