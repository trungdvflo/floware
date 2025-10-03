import { Injectable } from "@nestjs/common";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { GetOptionInterface } from "../interface/typeorm.interface";
import { CalendarInstanceEntity } from "../models/calendar-instance.entity";
import { CollectionEntity } from "../models/collection.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(CalendarInstanceEntity)
export class CalendarInstanceRepository extends BaseRepository<CalendarInstanceEntity> {
  async createCalendarInstance(fields: Partial<CalendarInstanceEntity>) {
    const calendarInstance = this.create(fields);
    return await this.save(calendarInstance);
  }

  async findOneByCalendarUri(options: GetOptionInterface<CalendarInstanceEntity>) {
    const aliasName = 'ci';
    return this.createQueryBuilder(aliasName)
      .select(options?.fields.map(f => `${aliasName}.${f}`))
      .where(`${aliasName}.uri = :uri`, { uri: options.conditions['uri'] })
      .getOne();
  }

  async getCalInstanceItemByColId(colId: number,
    options: GetOptionInterface<CalendarInstanceEntity>) {
    const aliasName = 'ci';
    return this.createQueryBuilder(aliasName)
      .select(options?.fields.map(f => `${aliasName}.${f}`))
      .innerJoin(CollectionEntity, 'c', `c.calendar_uri = ${aliasName}.uri`)
      .where('c.id = :colId', { colId })
      .getOne();
  }
}