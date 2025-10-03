/* eslint-disable prettier/prettier */
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getUtcMillisecond } from 'common/utils/datetime.util';
import { MeetingStatus } from 'entities/meeting.entity';
import { ActivitiesType, MeetingActivitiesEntity } from 'entities/meeting_activities.entity';
import { JoinStatus, JoinType } from 'entities/meeting_attendee.entity';
import { MeetingService } from 'modules/meeting/meeting.service';
import { MEETING_COUNTER_PREFIX, RedisCacheRepository } from 'modules/redis/repository/redis-cache.repository';
import { MeetingActivitiesRepository } from 'repositories/meeting-activity.repository';
import { MeetingAttendeeRepository } from 'repositories/meeting-attendee.repository';
import { MeetingInfoRepository } from 'repositories/meeting-info.repository';
import { MeetingUserUsageRepository } from 'repositories/meeting-user-usage.repository';

@Injectable()
export class MeetingEventService {
  private endMettingTaskTimeout = {};
  constructor(
    @Inject(RedisCacheRepository)
    private readonly redisRepository: RedisCacheRepository,
    private readonly meetingRepository: MeetingInfoRepository,
    private readonly meetingAttendeeRepository: MeetingAttendeeRepository,
    private readonly meetingActivitiesRepository: MeetingActivitiesRepository,
    private readonly meetingUserUsage: MeetingUserUsageRepository,
    private readonly meetingService: MeetingService,
    private readonly configService: ConfigService
  ) {
  }
  async cleanUpData(meetingId: string) {
    try {
      await this.redisRepository.delete(MEETING_COUNTER_PREFIX, meetingId);
      if (meetingId in this.endMettingTaskTimeout) {
        clearTimeout(this.endMettingTaskTimeout[meetingId]);
      }
    } catch(error) {
      console.log(error)
    }
  }

  async increaseMeetingAttendee(meetingId: string) {
    const currentCounterInRedis = await this.redisRepository.incr(MEETING_COUNTER_PREFIX, meetingId);
    if (currentCounterInRedis > 1) {
      if (meetingId in this.endMettingTaskTimeout) {
        clearTimeout(this.endMettingTaskTimeout[meetingId]);
      }
      return;
    }
    await this.handleAutoEndMeeting(meetingId, currentCounterInRedis);
  }

  async decreaseMeetingAttendee(meetingId: string) {
    return await this.redisRepository.decr(MEETING_COUNTER_PREFIX, meetingId);
  }

  async getMeeting(meetingId: string) {
    try {
      return await this.meetingRepository.findOneBy({
        meeting_id: meetingId
      })
    } catch(error) {
      console.log(error)
    }
  }
  async updateStatusEndMeeting(meetingId: string, end_time: number) {
    try {
      if (!meetingId) {
        return;
      }
      await this.meetingRepository.updateStatusEnd(meetingId, end_time)
    } catch (error) {
      console.error(error)
    }
  }

  async updateMeetingAttendeeSpendTime(
    meetingId: string,
    endTime: number,
    attendeeid: string, 
    phoneNumber: string) {
    let attendee = null
    if (attendeeid) {
      attendee = await this.getMeetingAttendeeByAttendeeId(meetingId, attendeeid)
    } else {
      attendee = await this.getMeetingAttendeeByPhone(meetingId, phoneNumber)
    }
    if (!attendee) {
      return;
    }
    const joinActivity = await this.getJoinActivity(attendee.meeting_id, attendee.attendee_id, attendee.phone_number)
    attendee.spend_time = endTime - joinActivity.activity_time
    attendee.join_time = joinActivity.activity_time
    attendee.end_time = endTime
    if (attendee.status != JoinStatus.DROPED) {
      attendee.status = JoinStatus.LEAVED
    }
    await this.meetingAttendeeRepository.save(attendee);

    // Update user usage
    const userUsage = await this.meetingUserUsage.userUsage(attendee.user_email)
    if (attendee.join_type == JoinType.INTERNET) {
      userUsage.increMeetingInternetSpent(attendee.spend_time)
    } else {
      userUsage.increMeetingDialOutboundSpent(attendee.spend_time)
    }
    userUsage.save()
  }

  async updateMeetingAttendeeSpendTimeByDrop(meetingId: string, endTime: number, attendeeid: string, phoneNumber: string) {
    let attendee = null
    if (attendeeid) {
      attendee = await this.getMeetingAttendeeByAttendeeId(meetingId, attendeeid)
    } else {
      attendee = await this.getMeetingAttendeeByPhone(meetingId, phoneNumber)
    }
    if (!attendee) {
      return;
    }
    const joinActivity = await this.getJoinActivity(attendee.meeting_id, attendee.attendee_id, attendee.phone_number)
    attendee.spend_time = endTime - joinActivity.activity_time
    attendee.join_time = joinActivity.activity_time
    attendee.end_time = endTime
    attendee.status = JoinStatus.DROPED
    await this.meetingAttendeeRepository.save(attendee);
    // Update user usage
    const userUsage = await this.meetingUserUsage.userUsage(attendee.user_email)
    if (attendee.join_type == JoinType.INTERNET) {
      userUsage.increMeetingInternetSpent(attendee.spend_time)
    } else {
      userUsage.increMeetingDialOutboundSpent(attendee.spend_time)
    }
    userUsage.save()
  }

  async updateMeetingAttendeeStatus(param: any) {
    let attendee = null
    if (param?.attendee_id) {
      attendee = await this.getMeetingAttendeeByAttendeeId(param.meeting_id, param.attendee_id)
    } else {
      attendee = await this.getMeetingAttendeeByPhone(param.meeting_id, param.phone_number)
    }
    if (!attendee) {
      return;
    }
    attendee.join_time = param.activity_time
    attendee.status = param.type
    return await this.meetingAttendeeRepository.save(attendee);
  }

  async getMeetingAttendee(meetingId: string) {
    return await this.meetingAttendeeRepository.find({
      where: {
        meeting_id: meetingId
      },
      order: {
        id: 'ASC'
      }
    });
  }

  async getMeetingAttendeeByAttendeeId(meetingId: string, attendeeId: string) {
    return await this.meetingAttendeeRepository.findOne({
      where: {
        meeting_id: meetingId,
        attendee_id: attendeeId
      }
    });
  }

  async getMeetingAttendeeByPhone(meetingId: string, phoneNumber: string) {
    return await this.meetingAttendeeRepository.findOne({
      where: {
        meeting_id: meetingId,
        phone_number: phoneNumber
      }
    });
  }

  async getMeetingActivities(meetingId: string) {
    return await this.meetingActivitiesRepository.find({
      where: {
        meeting_id: meetingId
      },
      order: {
        id: 'ASC'
      }
    });
  }

  async getJoinActivity(meetingId: string, attendeeId: string, phoneNumber: string) {
    if (phoneNumber) {
      return await this.meetingActivitiesRepository.findOneBy({
          meeting_id: meetingId,
          phone_number: phoneNumber,
          type: ActivitiesType.JOINED
      });
    } else {
      return await this.meetingActivitiesRepository.findOneBy({
          meeting_id: meetingId,
          attendee_id: attendeeId,
          type: ActivitiesType.JOINED
      });
    }
  }

  async filterAttendeeActivity(attendeeParam: any, activities: MeetingActivitiesEntity[]) {
    if (attendeeParam?.phone_number) {
      return activities.filter((activity) => activity.phone_number == attendeeParam.phone_number);
    } else {
      return activities.filter((activity) => activity.attendee_id == attendeeParam.attendee_id);
    }
  }

  async summaryAttendeeSpentTime(activities: MeetingActivitiesEntity[]) {
    let joinTime = 0;
    let endTime = 0;
    for (const activity of activities) {
        if(activity.type == ActivitiesType.JOINED) {
          joinTime = activity.activity_time
        }

        if(activity.type == ActivitiesType.LEAVED) {
          endTime = activity.activity_time
        }
    }

    if (joinTime && endTime) {
        return {
          joinTime,
          endTime,
          spendTime: endTime - joinTime
        }
    }
    return {
        joinTime,
        endTime,
        spendTime: 0
    }
  }

  async saveMeetingActivities(param: any) {
    const {
      meeting_id,
      attendee_id,
      phone_number, 
      type, 
      activity_time
    } = param
    const currentTime = getUtcMillisecond()/1000;
    const entityActivityAttendee = this.meetingActivitiesRepository.create(
      {
        meeting_id,
        attendee_id,
        phone_number,
        type,
        activity_time,
        created_date: currentTime,
        updated_date: currentTime,
      });
    await this.meetingActivitiesRepository.save(entityActivityAttendee);
  }

  async handleAutoEndMeeting(meetingId: string, atteendeeCount: number) {
    try {

      if (atteendeeCount > 1) {
        return;
      }

      if (meetingId in this.endMettingTaskTimeout) {
        clearTimeout(this.endMettingTaskTimeout[meetingId]);
      }

      const delayEndMeetingSoon = 3000; // wait for 3 seconds before end meeting
      let delayEndMeeting = atteendeeCount <= 0 ? delayEndMeetingSoon : this.configService.get('app.meetingEndTimeout');
      if (await this.isMeetingWithNoneUser(meetingId)) {
        delayEndMeeting = this.configService.get('app.meetingEndTimeoutNoneUser');
      }
      // end meeting affter time setting
      const that = this;
      this.endMettingTaskTimeout[meetingId] = setTimeout(async () => {
        await that.forceEndMeeting(meetingId);
      }, delayEndMeeting);
    } catch (err) {
      console.error(err);
    }
  }
  
  async forceEndMeeting(meetingId: string) {
    try {
      // double check meeting status
      const meeting = await this.getMeeting(meetingId);
      if (meeting.status == MeetingStatus.ENDED) {
        return;
      }
      const countJoining = await this.meetingAttendeeRepository.countBy({
        meeting_id: meetingId,
        status: JoinStatus.JOINED
      });
      if (countJoining > 1) {
        return;
      }

      // recheck counter in redis
      const currentCounterInRedis = await this.countMeetingAttendeeInCache(meetingId);
      if (parseInt(currentCounterInRedis) > 1 || parseInt(currentCounterInRedis) != countJoining) {
        return;
      }
      return await this.meetingService.deleteMeeting(meetingId);
    } catch (err) {
      console.error(err);
    }
  }

  async countMeetingAttendeeInCache(meetingId: string) {
    return await this.redisRepository.get(MEETING_COUNTER_PREFIX, meetingId);
  }

  async isMeetingWithNoneUser(meetingId: string) {
    const countNoneUser = await this.meetingAttendeeRepository.countBy({
        meeting_id: meetingId,
        is_flo_user: false
    });
    return countNoneUser > 0;
  }
}