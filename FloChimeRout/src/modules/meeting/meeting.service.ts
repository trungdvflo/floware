/* eslint-disable prettier/prettier */
import { ChimeSDKVoiceClient, CreateSipMediaApplicationCallCommand } from "@aws-sdk/client-chime-sdk-voice";
import { BadRequestException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as AWS from 'aws-sdk';
import {
  Attendee,
  AttendeeList,
  CreateMeetingWithAttendeesResponse,
  DeleteAttendeeRequest,
  Meeting
} from 'aws-sdk/clients/chimesdkmeetings';
import { ErrorCode, ErrorMessage } from 'common/constants/erros-dict.constant';
import {
  MSG_ERR_CHIME,
  MSG_ERR_CHIME_LIMIT,
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_FLO_DOMAIN,
  MSG_ERR_NON_FLO_DOMAIN,
} from 'common/constants/message.constant';
import { ATTENDEE } from 'common/constants/system.constant';
import { retryWithExponentialBackoff } from 'common/utils/chime.util';
import {
  detectDomainFlo,
  filterDuplicateItem,
  filterListAttendee,
} from 'common/utils/common.util';
import {
  getUpdateTimeByIndex,
  getUtcMillisecond,
} from 'common/utils/datetime.util';
import {
  buildItemResponseFail,
  buildSingleResponseErr,
} from 'common/utils/respond';
import chimeConfig from "configs/chime.config";
import { MeetingStatus } from 'entities/meeting.entity';
import { JoinStatus, JoinType } from 'entities/meeting_attendee.entity';
import { END_MEETING, START_MEETING } from 'modules/communication/events';
import { MeetingEvent } from 'modules/communication/events/meeting.event';
import { ConferenceMemberRepo } from 'repositories/conference_member.repository';
import { MeetingActivitiesRepository } from "repositories/meeting-activity.repository";
import { MeetingAttendeeRepository } from 'repositories/meeting-attendee.repository';
import { MeetingInfoRepository } from 'repositories/meeting-info.repository';
import { MeetingUserUsageRepository } from "repositories/meeting-user-usage.repository";
import { MeetingRepository } from 'repositories/meeting.repository';
import { v4 as uuidv4 } from 'uuid';
import appConfig from '../../configs/app.config';
import { CreateMeetingDTO } from './dtos/meeting.post.dto';
@Injectable()
export class MeetingService {
  private readonly chime: AWS.Chime;
  private readonly chimeSdkVoiceClient: ChimeSDKVoiceClient;
  private readonly sts: AWS.STS;
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly meetingInfoRepository: MeetingInfoRepository,
    private readonly meetingAttendeeRepository: MeetingAttendeeRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly confMemberRepo: ConferenceMemberRepo,
    private readonly meetingUserUsage: MeetingUserUsageRepository,
    private readonly meetingActivitiesRepo: MeetingActivitiesRepository

  ) {
    // Try cache for generate route
    try {
      // Create an AWS SDK Chime object. Region 'us-east-1' is currently required.
      // Use the MediaRegion property below in CreateMeeting to select the region
      // the meeting is hosted in.
      const config = {
        region: process.env.CHIME_REGION
        // credentials: {
        // accessKeyId: 'accessKeyId',
        // secretAccessKey: 'secretAccessKey'
        // }
      };

      this.chime = new AWS.Chime(config);

      this.sts = new AWS.STS({
        credentials: {
          accessKeyId: chimeConfig().accessKeyId,
          secretAccessKey: chimeConfig().secretKey,
        }
      });
      // Set the AWS SDK Chime endpoint. The global endpoint is https://service.chime.aws.amazon.com.
      this.chime.endpoint = new AWS.Endpoint(process.env.CHIME_ENDPOINT);

      this.chimeSdkVoiceClient = new ChimeSDKVoiceClient(config);
    } catch (error) {
      //
    }
  }
  private async createChimeSTS() {
    const sessionName = uuidv4();
    const assumeRoleParams = {
      RoleArn: chimeConfig().role_arn,
      RoleSessionName: sessionName,
      DurationSeconds: 1200
    };
    const stsData = await this.sts.assumeRole(assumeRoleParams).promise();
    const credentials = stsData.Credentials;
    const credentialConfig = {
      accessKeyId: credentials.AccessKeyId,
      secretAccessKey: credentials.SecretAccessKey,
      sessionToken: credentials.SessionToken,
      region: chimeConfig().region,
      endpoint: chimeConfig().meetingEndpoint,
    };
    const chimeMessagingClient = new AWS.Chime(credentialConfig);
    return chimeMessagingClient;
  }

  async createMeetingWithAttendee(data: CreateMeetingDTO, { user, headers }) {
    try {
      const itemFail = [];
      const domainFlo: string[] = appConfig().floDomain.split(',');
      let lstNonAttendees = [];
      let lstAttendees = [];

      if (data.NonAttendees === undefined && data.Attendees === undefined) {
        const errRespond = buildSingleResponseErr(
          400,
          'Please fill list Attendee or Non attendee',
          data,
        );
        throw new BadRequestException(errRespond);
      }

      // filter dubplicate attendeees
      if (data.Attendees !== undefined) {
        // remove duplicate object
        const { uniqueArr: uniqueAttendee, dataError } = filterDuplicateItem(
          data.Attendees,
        );
        if (dataError.length > 0) {
          dataError.map((item) => {
            const errItem = buildItemResponseFail(
              ErrorCode.DUPLICATE_ENTRY,
              MSG_ERR_DUPLICATE_ENTRY,
              item,
            );
            itemFail.push(errItem);
          });
        }

        const { floUsers, nonFloUsers } = detectDomainFlo(
          uniqueAttendee,
          domainFlo,
        );
        if (nonFloUsers.length > 0) {
          nonFloUsers.map((item) => {
            const errItem = buildItemResponseFail(
              ErrorCode.BAD_REQUEST,
              `${MSG_ERR_FLO_DOMAIN}${appConfig().floDomain}`,
              item,
            );
            itemFail.push(errItem);
          });
        }
        lstAttendees = floUsers;
      }

      if (data.NonAttendees !== undefined) {
        // remove duplicate object
        const { uniqueArr: uniqueNonAttendee, dataError } = filterDuplicateItem(
          data.NonAttendees,
        );
        if (dataError.length > 0) {
          dataError.map((item) => {
            const errItem = buildItemResponseFail(
              ErrorCode.DUPLICATE_ENTRY,
              MSG_ERR_DUPLICATE_ENTRY,
              item,
            );
            itemFail.push(errItem);
          });
        }

        const { floUsers, nonFloUsers } = detectDomainFlo(
          uniqueNonAttendee,
          domainFlo,
        );
        if (floUsers.length > 0) {
          floUsers.map((item) => {
            const errItem = buildItemResponseFail(
              ErrorCode.BAD_REQUEST,
              `${MSG_ERR_NON_FLO_DOMAIN}${appConfig().floDomain}`,
              item,
            );
            itemFail.push(errItem);
          });
        }
        lstNonAttendees = nonFloUsers;
      }

      const combineAttendee = [...lstAttendees, ...lstNonAttendees];
      if (combineAttendee?.length > ATTENDEE.limitUserMeeting) {
        const itemFail = [];
        const errItem = buildItemResponseFail(
          ErrorMessage.VALIDATION_FAILED,
          `${MSG_ERR_CHIME_LIMIT}${ATTENDEE.limitUserMeeting}`,
        );
        itemFail.push(errItem);
        const errRespond = buildSingleResponseErr(400, itemFail as []);
        throw new BadRequestException(errRespond);
      }

      if (combineAttendee?.length === 0) {
        const errItem = buildItemResponseFail(
          ErrorMessage.VALIDATION_FAILED,
          MSG_ERR_CHIME,
        );
        itemFail.push(errItem);
        const errRespond = buildSingleResponseErr(400, itemFail as []);
        throw new BadRequestException(errRespond);
      }
      // Read resource names from the environment
      const { SNS_CHIME_EVENT_ARN, MEETING_MEDIA_REGION } = process.env;
      const request = {
        // Use a UUID for the client request token to ensure that any request retries
        // do not create multiple meetings.
        ClientRequestToken: uuidv4(),

        // Specify the media region (where the meeting is hosted).
        // In this case, we use the region selected by the user.
        MediaRegion: MEETING_MEDIA_REGION,
        // Set up SQS notifications if being used
        NotificationsConfiguration: {
          SnsTopicArn: SNS_CHIME_EVENT_ARN
        },
        // Any meeting ID you wish to associate with the meeting.
        // For simplicity here, we use the meeting title.
        ExternalMeetingId: data.ExternalMeetingId,

        // Tags associated with the meeting. They can be used in cost allocation console
        Tags: [{ Key: 'Department', Value: 'RND' }],
        Attendees: combineAttendee.map((item: string) => ({
          ExternalUserId: item,
        })),
      };
      const meeting = await retryWithExponentialBackoff(async () => {
        const chimeClient: AWS.Chime = await this.createChimeSTS();
        return await this.requestCreateMeeting(request, chimeClient)
      })

      // filter list non users
      const rsAttendees: AttendeeList = meeting.Attendees;
      const { filterAttendees, filterNonAttendees } = filterListAttendee(
        rsAttendees,
        lstNonAttendees,
      );
      // save meeting to new table
      await this.saveMeeting(meeting.Meeting, user.id, data?.ChannelId, data?.ChannelTitle);

      // send realtime meeting start
      // this.eventEmitter.emit(START_MEETING, {
      //   headers,
      //   channelId: data.ChannelId || 0,
      //   channelTitle: data.ChannelTitle || '',
      //   meetingId: meeting.Meeting.MeetingId,
      // } as MeetingEvent);
      // save attendee db
      if (rsAttendees.length > 0) {
        await this.meetingAttendeeRepository.saveAttendees(meeting.Meeting.MeetingId, rsAttendees, user.id)
      }
      // save non user infor
      await this.storageNonUserInfor(meeting.Meeting, filterNonAttendees);
      return {
        data: {
          Meeting: meeting.Meeting,
          Attendees: filterAttendees,
          NonAttendees: filterNonAttendees,
        },
        Errors: itemFail,
      };
    } catch (error) {
      throw error;
    }
  }

  async requestCreateMeeting(request: any, chimeService: any) {
    const meeting: CreateMeetingWithAttendeesResponse = await chimeService
      .createMeetingWithAttendees(request)
      .promise();
    return meeting
  }

  async storageNonUserInfor(
    metingConfig: Meeting,
    lstNonAttendees: Attendee[],
  ) {
    const currentTime = getUtcMillisecond();
    const entityNonAttendeeValid = [];
    await Promise.all(
      lstNonAttendees.map(async (item: Attendee, idx: number) => {
        try {
          const dateItem = getUpdateTimeByIndex(currentTime, idx);
          const entityNonAttendee = this.meetingRepository.create({
            meeting_config: metingConfig,
            meeting_id: metingConfig.MeetingId,
            attendee_id: item.AttendeeId,
            external_attendee: item.ExternalUserId,
            join_token: item.JoinToken,
            created_date: dateItem,
            updated_date: dateItem,
          });
          entityNonAttendeeValid.push(entityNonAttendee)
        } catch (error) {
          throw error;
        }
      }),
    );
    await this.meetingRepository.insert(entityNonAttendeeValid);
  }
  // This is function add new by ThieuLe, to store meeting information and status meeting. 
  // Because in during refactor, I store duplicate data meeting infor, as soon, I will remove the meeting infor in other tables.
  async saveMeeting(
    meeting: Meeting,
    user_id: number,
    channel_id?: number,
    channel_title?: string
  ) {
    try {
      const meetingEntity = this.meetingInfoRepository.create({
        media_placement: meeting.MediaPlacement,
        meeting_id: meeting.MeetingId,
        external_meeting_id: meeting.ExternalMeetingId,
        media_region: meeting.MediaRegion,
        spend_time: 0,
        host_user_id: user_id,
        status: MeetingStatus.STARTED,
        channel_id: channel_id,
        channel_title: channel_title
      });
      await this.meetingInfoRepository.save(meetingEntity);
    } catch (error) {
      console.error(error);
      throw error
    }
  }
  async statistics(email: string) {
    const usage = await this.meetingUserUsage.userUsage(email)
    return { data: usage.usage }
  }

  async getActivities(channelId: number) {
    return { data: await this.meetingInfoRepository.getActivities(channelId) };
  }


  async getMeetingById(MeetingId: string): Promise<object> {
    try {
      if (!MeetingId) {
        throw new BadRequestException('Need parameters: MeetingId');
      }

      // Get the meeting
      // The meeting ID of the created meeting to add the attendee to
      let meeting: any = await this.meetingInfoRepository.findOne({
        where: {
          meeting_id: MeetingId
        }
      });
      if (meeting?.meeting_id) {
        if (meeting.status == MeetingStatus.STARTED) {
          return {
            data: {
              Meeting: {
                MeetingId: meeting?.meeting_id,
                ExternalMeetingId: meeting?.external_meeting_id,
                MediaRegion: meeting.media_region,
                MediaPlacement: meeting.media_placement
              }
            }
          }
        } else {
          throw new HttpException('The meeting has ended', HttpStatus.NOT_FOUND);
        }

      }
      meeting = await retryWithExponentialBackoff(async () => { return await this.chime.getMeeting({ MeetingId }).promise() })
      // Return the meeting and attendee responses. The client will use these
      // to join the meeting.

      if (!meeting.Meeting.MeetingId) {
        throw meeting.$response.error;
      }

      return { data: { ...meeting } };
    } catch (error) {
      throw error;
    }
  }

  async deleteMeeting(MeetingId: string): Promise<any> {
    try {
      if (!MeetingId) {
        throw new BadRequestException('Need parameters: MeetingId');
      }
      // delete meeting on db
      await this.meetingRepository.delete({ meeting_id: MeetingId });
      const meeting = await this.meetingInfoRepository.findOneBy({
        meeting_id: MeetingId
      });
      if (meeting?.channel_id) {
        this.eventEmitter.emit(END_MEETING, {
          channelId: meeting.channel_id,
          channelTitle: meeting?.channel_title,
          meetingId: MeetingId,
        } as MeetingEvent);
      }

      // await this.meetingInfoRepository.delete({meeting_id: MeetingId })
      // update status ended to database
      const currentTime = getUtcMillisecond() / 1000;
      await this.meetingInfoRepository.updateStatusEnd(MeetingId, currentTime)
      // remove meeting on aws chime
      const chimeService = this.chime
      const rs = await retryWithExponentialBackoff(async () => { return await chimeService.deleteMeeting({ MeetingId }).promise() })
      return rs;
    } catch (error) {
      throw error;
    }
  }
  async callPhoneFromMeeting(meetingId: string, phoneNumber: string) {
    const meeting: any = await this.meetingInfoRepository.findOne({
      where: {
        meeting_id: meetingId,
        status: MeetingStatus.STARTED
      }
    });
    if (!meeting?.id) {
      throw new NotFoundException('Meeting ' + meetingId + " not found or ended!")
    }

    const attendee = await this.addPhoneAttendee(meetingId, phoneNumber)
    if (!attendee?.Attendee?.JoinToken) {
      throw new BadRequestException("Can not add attendee with phone to this meeting")
    }
    const phoneCall = await this.callPhoneOutbound(attendee.Attendee.JoinToken, meetingId, phoneNumber)
    return {
      data: {
        attendee,
        phoneCall
      }
    }
  }

  async addPhoneAttendee(meetingId: string, phoneNumber: string): Promise<any> {
    return await this.chime.createAttendee({
      MeetingId: meetingId,
      ExternalUserId: 'user-phone-' + phoneNumber
    }).promise()
  }

  async callPhoneOutbound(joinToken: string, meetingId: string, toNumber: string): Promise<any> {
    const { CHIME_SMA_ID, CHIME_SMA_FROM_PHONE, CHIME_SMA_TO_PHONE } = process.env;
    const params = {
      FromPhoneNumber: CHIME_SMA_FROM_PHONE,
      SipMediaApplicationId: CHIME_SMA_ID,
      ToPhoneNumber: CHIME_SMA_TO_PHONE,
      SipHeaders: {
        'X-chime-join-token': joinToken,
        'X-chime-meeting-id': meetingId,
      },
      ArgumentsMap: {
        MeetingId: meetingId,
        RequestedDialNumber: toNumber,
        RequestedVCArn: '',
        RequestorEmail: '',
        DialVC: 'false',
      },
    };

    return await this.chimeSdkVoiceClient.send(
      new CreateSipMediaApplicationCallCommand(params)
    );
  }

  async savePhoneAttendee(meetingId: string, phoneNumber: string, attendee: Attendee, user_id: number): Promise<object> {
    const currentTime = getUtcMillisecond() / 1000;
    const entityAttendee = this.meetingAttendeeRepository.create(
      {
        meeting_id: meetingId,
        attendee_id: attendee.AttendeeId,
        user_email: attendee.ExternalUserId,
        phone_number: phoneNumber,
        spend_time: 0,
        join_token: attendee.JoinToken,
        status: JoinStatus.PENDING,
        join_type: JoinType.DIAL,
        is_flo_user: false,
        created_date: currentTime,
        updated_date: currentTime,
        add_by: user_id
      });
    return await this.meetingAttendeeRepository.save(entityAttendee);
  }

  async deleteAttendee(params: DeleteAttendeeRequest): Promise<any> {
    try {
      const chimeRes = await this.chime.deleteAttendee(params).promise();

      if (chimeRes.$response.error) {
        console.log(chimeRes.$response.error);
      }
    } catch (error) {
      console.log(error);
    }
  }

}
function InjectRepository(
  CollectionRepository: any,
): (
  target: typeof MeetingService,
  propertyKey: undefined,
  parameterIndex: 0,
) => void {
  throw new Error('Function not implemented.');
}
