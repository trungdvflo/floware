import { Injectable } from '@nestjs/common';
import {
    Attendee,
} from 'aws-sdk/clients/chime';
import { isUserFlo } from 'common/utils/common.util';
import { getUpdateTimeByIndex, getUtcMillisecond } from 'common/utils/datetime.util';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { JoinStatus, JoinType, MeetingAttendeeEntity } from 'entities/meeting_attendee.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(MeetingAttendeeEntity)
export class MeetingAttendeeRepository extends Repository<MeetingAttendeeEntity> {
    async saveAttendees(
        meeting_id: string,
        attendees: Attendee[],
        user_id: number
      ) {
        const currentTime = getUtcMillisecond();
        await Promise.all(
          attendees.map(async (item: Attendee, idx: number) => {
            try {
              const dateItem = getUpdateTimeByIndex(currentTime, idx);
              const entityAttendee = this.create(
              {
                meeting_id: meeting_id,
                attendee_id: item.AttendeeId,
                user_email: item.ExternalUserId,
                phone_number: '',
                spend_time: 0,
                join_token: item.JoinToken,
                status: JoinStatus.PENDING,
                join_type: JoinType.INTERNET,
                is_flo_user: isUserFlo(item.ExternalUserId),
                created_date: dateItem,
                updated_date: dateItem,
                add_by: user_id
              });
              await this.save(entityAttendee);
            } catch (error) {
              console.error(error);
              throw error
            }
          }),
        );
      }
}