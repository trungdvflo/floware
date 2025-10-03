import { Injectable } from "@nestjs/common";
import { DELETE_FUNC, OBJ_TYPE } from "../constants/common.constant";
import { CustomRepository } from "../decorator/typeorm.decorator";
import { CalendarInstanceEntity } from "../models/calendar-instance.entity";
import { CalendarObjectEntity } from "../models/calendar-object.entity";
import { CalendarEntity } from "../models/calendar.entity";
import { BaseRepository } from "./base.repository";

@Injectable()
@CustomRepository(CalendarObjectEntity)
export class CalendarObjectsRepository extends BaseRepository<CalendarObjectEntity> {
  async deleteCaldav(calendarId: number) {
    try {
      const data = await this.manager
      .query(`SELECT ${DELETE_FUNC.CALDAV}(?) vReturn`, [calendarId]);
      return data;
    } catch (error) {
      return error;
    }
  }

  async getListTodoUid(principaluri, lsUid): Promise<{ uid: string }[]> {
    const query = this
      .createQueryBuilder('co')
      .select('co.uid')
      .innerJoin(CalendarEntity, 'cal', 'cal.id = co.calendarid')
      .innerJoin(CalendarInstanceEntity, 'ci', 'ci.calendarid = cal.id')
      .where(`co.uid IN (:...uid)
          AND ci.principaluri = :principaluri
          AND co.componenttype = :componentType`, {
        uid: lsUid,
        principaluri,
        componentType: OBJ_TYPE.VTODO
      });
    return await query.getMany();
  }
}