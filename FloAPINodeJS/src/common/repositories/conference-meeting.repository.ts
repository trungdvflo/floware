import { Injectable } from "@nestjs/common";
import { Repository } from "typeorm";
import { CustomRepository } from "../decorators/typeorm-ex.decorator";
import { ConferenceMeetingEntity } from "../entities";
import { IUser } from "../interfaces";
import { getUtcSecond } from "../utils/date.util";

@Injectable()
@CustomRepository(ConferenceMeetingEntity)
export class ConferenceMeetingRepository extends Repository<ConferenceMeetingEntity> {

  // Create if not exists by channelId and meetingId
  async createIfNotExists(channelId: number, meetingId: string, exMeetingId: string, user: IUser) {
    const meeting = await this.findOne({
      where: {
      channel_id: channelId,
      meeting_id: meetingId
      }
    });
    if (!meeting) {
      const newMeeting = this.create({
      channel_id: channelId,
      meeting_id: meetingId,
      external_meeting_id: exMeetingId,
      user_id: user.id,
      created_date: getUtcSecond(),
      updated_date: getUtcSecond(),
      });
      const savedMeeting = await this.save(newMeeting);
      return savedMeeting.id;
    }
    return meeting.id;
  }

  // Check meeting exists by channelId and meetingId
  async checkMeetingExists(channelId: number, meetingId: string) {
    const meeting = await this.findOne({
      where: {
      channel_id: channelId,
      meeting_id: meetingId
      }
    });
    return !!meeting;
  }
}