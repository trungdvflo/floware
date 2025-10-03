import { Injectable } from '@nestjs/common';
import AWS, { STS } from 'aws-sdk';
import { plainToClass } from 'class-transformer';
import { IReqUser } from 'common/interfaces/auth.interface';
const throttledQueue = require('throttled-queue');
// import throttledQueue from 'throttled-queue';
import { ErrorCode, ErrorMessage } from 'common/constants/erros-dict.constant';
import { CHANNEL } from 'common/constants/system.constant';
import { buildFailItemResponses } from 'common/utils/chatting.respond';
import { getUtcMillisecond } from 'common/utils/datetime.util';
import { MeetingEntity, MeetingStatus } from 'entities/meeting.entity';
import { MeetingInfoRepository } from 'repositories/meeting-info.repository';
import { GetChannelDTO } from './dtos/channel.get.dto';
import { ConferenceHistoryRepository } from './repositories/conference-history.repository';
import { ConferencingMemberRepository } from './repositories/conferencing-member.repository';
@Injectable()
export class ChannelService {
  private readonly chime: AWS.Chime;
  private readonly sts: STS;
  constructor(
    private readonly conferencingMemberRepo: ConferencingMemberRepository,
    private readonly conferenceHistoryRepository: ConferenceHistoryRepository,
    private readonly meetingInfoRepository: MeetingInfoRepository
  ) { }

  async getStatusMeetingByChannel(channel: GetChannelDTO, user: IReqUser) {
    const startingMeeting = await this.getMeetingsIsStarting()
    if (!startingMeeting) {
      return { data: [] }
    }
    const dtoChannel = plainToClass(GetChannelDTO, channel);
    const memberItem = await this.conferencingMemberRepo.findOne({
      select: ['id'],
      where: {
        revoke_time: CHANNEL.NONE_REVOKE,
        user_id: user.userId,
        channel_id: dtoChannel.channel_id,
      },
    });
    if (!memberItem) {
      const errItem = buildFailItemResponses(
        ErrorCode.BAD_REQUEST,
        ErrorMessage.CHANNEL_DOES_NOT_EXIST,
        dtoChannel,
      );
      return { error: errItem };
    }

    const meetingItem = await this.conferenceHistoryRepository.findOne({
      select: ['meeting_id', 'external_meeting_id'],
      where: {
        member_id: memberItem.id
      },
      order: {
        updated_date: 'DESC',
      },
    });

    if (meetingItem?.meeting_id) {
      const meetingStarting = await this.getMeetingByMeetingId(meetingItem.meeting_id)
      const currentTime = getUtcMillisecond() / 1000;
      const minTimeValid = currentTime - (CHANNEL.EXPIRE_TIME) * 3600
      if (meetingStarting && meetingStarting.created_date > minTimeValid) {
        return {
          data: [
            {
              channel_id: dtoChannel.channel_id,
              meeting_id: meetingItem.meeting_id,
              external_meeting_id: meetingItem.external_meeting_id ? meetingItem.external_meeting_id : null,
              organizer: meetingStarting.email,
              status: meetingStarting?.status === MeetingStatus.STARTED ? 1 : 0,
            },
          ],
        };
      }
      return {
        data: [
          {
            channel_id: dtoChannel.channel_id,
            meeting_id: meetingItem?.meeting_id,
            external_meeting_id: meetingItem.external_meeting_id ? meetingItem.external_meeting_id : null,
            organizer: meetingStarting?.email,
            status: 0,
          },
        ],
      };
    }

    return {
      data: [
        {
          channel_id: dtoChannel.channel_id,
          meeting_id: null,
          external_meeting_id: null,
          organizer: null,
          status: 0,
        },
      ],
    };

  }

  async getStatusMeeting(user: IReqUser) {
    const validChannel = [];
    const startingMeeting = await this.getMeetingsIsStarting()

    if (startingMeeting?.length <= 0) {
      return { data: [] }
    }

    const meetingItems = await this.conferencingMemberRepo.getMeetingsByUser(user.userId);
    if (meetingItems?.length === 0) {
      return { data: [] };
    }
    const currentTime = getUtcMillisecond() / 1000;
    const minTimeValid = currentTime - (CHANNEL.EXPIRE_TIME) * 3600
    for (const item of meetingItems) {
      const meetingStatus = startingMeeting
        .find((meeting: MeetingEntity) => (meeting.meeting_id == item.meeting_id) && (meeting.created_date > minTimeValid))

      if (!!meetingStatus) {
        validChannel.push({
          channel_id: item.channel_id,
          meeting_id: item.meeting_id,
          external_meeting_id: item.external_meeting_id ? item.external_meeting_id : null,
          organizer: meetingStatus.email,
          status: 1,
        });
      }
    }
    return { data: validChannel };
  }

  async getMeetingsIsStarting() {
    return await this.meetingInfoRepository
      .createQueryBuilder('cm')
      .select(['cm.meeting_id meeting_id', 'cm.created_date created_date', 'uu.email email'])
      .innerJoin('user', 'uu', 'uu.id = cm.host_user_id')
      .where('cm.status=:status', { status: MeetingStatus.STARTED })
      .getRawMany();
  }

  async getMeetingByMeetingId(meetingId: string) {
    return await this.meetingInfoRepository
      .createQueryBuilder('cm')
      .select(['cm.status status', 'cm.created_date created_date', 'uu.email email'])
      .innerJoin('user', 'uu', 'uu.id = cm.host_user_id')
      .where('cm.meeting_id=:meeting_id', { meeting_id: meetingId })
      .getRawOne();
  }
}

