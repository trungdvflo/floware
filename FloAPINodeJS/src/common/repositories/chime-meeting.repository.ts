import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { ScheduleDTO } from "../../modules/conference-channel/dtos/schedule.dto";
import { CONFERENCE_SCHEDULE_CALL } from "../constants";
import { CustomRepository } from "../decorators/typeorm-ex.decorator";
import { ChimeMeetingEntity } from "../entities/chime-meeting.entity";
import { IUser } from "../interfaces";
import { getPlaceholderByN } from "../utils/common";
export type GetAllParams = {
  filter: ScheduleDTO,
  user: IUser
};

@Injectable()
@CustomRepository(ChimeMeetingEntity)
export class ChimeMeetingRepository extends Repository<ChimeMeetingEntity> {
  async getSchedules({ filter, user }: GetAllParams) {
    const { external_meeting_id, channel_id, page_size,
      page_no, sort, before_time, after_time } = filter;

    const convertExMId: string = external_meeting_id ? external_meeting_id.join(",") : null;
    const slaveConnection = this.manager.connection.createQueryRunner("slave");
    try {
      const { callType, spName, spParam } = CONFERENCE_SCHEDULE_CALL;
      const rawSchedule = await slaveConnection
        .query(`${callType} ${spName}(${getPlaceholderByN(spParam)})`, [
          channel_id
          , convertExMId
          , page_size
          , page_no
          , sort
          , before_time
          , after_time
        ]);
      const rsSchedule: ChimeMeetingEntity[] = !rawSchedule.length
        ? [] : rawSchedule[0];
      return rsSchedule;
    } finally {
      slaveConnection.release();
    }
  }
}
