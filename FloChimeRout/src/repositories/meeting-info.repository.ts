import { Injectable } from '@nestjs/common';
import { CustomRepository } from 'decorators/typeorm-ex.decorator';
import { MeetingEntity, MeetingStatus } from 'entities/meeting.entity';
import { MeetingActivitiesEntity } from 'entities/meeting_activities.entity';
import { MeetingAttendeeEntity } from 'entities/meeting_attendee.entity';
import { Repository } from 'typeorm';

@Injectable()
@CustomRepository(MeetingEntity)
export class MeetingInfoRepository extends Repository<MeetingEntity> {
    async updateStatusEnd(meetingId: string, end_time: number) {
      try {
        if (!meetingId) {
          return;
        }
        const meetingEntity = await this.findOne({
          where: { 
            meeting_id: meetingId, 
            status: MeetingStatus.STARTED 
          }
        });
        // only update when meeting exist in database and is STARTED
        if (meetingEntity) {
          meetingEntity.status = MeetingStatus.ENDED
          meetingEntity.end_time = end_time
          meetingEntity.spend_time = end_time - meetingEntity.start_time
          await this.save(meetingEntity);
        }
        
      } catch (error) {
        console.error(error)
        throw error
      }
    }

    async getActivities(channelId: number) {
      return await this.createQueryBuilder('cm')
      .select([
        'cma.meeting_id as meeting_id',
        "case when cma2.phone_number ='' or cma2.phone_number is NULL then cma2.user_email else null end as attendee_email",
        'cma.attendee_id as attendee_id',
        'cma2.phone_number as phone_number',
        'cma.`type` as action',
        'cma.activity_time as activity_time'
      ])
      .leftJoin(MeetingActivitiesEntity, 'cma', 'cma.meeting_id = cm.meeting_id')
      .innerJoin(MeetingAttendeeEntity, 'cma2', 'cma2.attendee_id  = cma.attendee_id')
      .where('cm.channel_id = :channelId', {channelId})
      .andWhere('cma.meeting_id  is not null')
      .orderBy('cma.activity_time', 'ASC')
      .getRawMany();
    }
}
