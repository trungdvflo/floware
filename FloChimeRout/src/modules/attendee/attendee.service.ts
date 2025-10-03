import { BadRequestException, Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import {
  Attendee,
  DeleteAttendeeRequest,
  GetAttendeeRequest,
  ListAttendeesRequest,
} from 'aws-sdk/clients/chime';
import { AttendeeList } from 'aws-sdk/clients/chimesdkmeetings';
import { ErrorCode, ErrorMessage } from 'common/constants/erros-dict.constant';
import {
  MSG_ERR_CHIME,
  MSG_ERR_CHIME_LIMIT,
  MSG_ERR_DUPLICATE_ENTRY,
  MSG_ERR_FLO_DOMAIN,
  MSG_ERR_NON_FLO_DOMAIN,
} from 'common/constants/message.constant';
import { retryWithExponentialBackoff } from 'common/utils/chime.util';
import {
  detectDomainFlo,
  filterDuplicateItem,
  filterListAttendee
} from 'common/utils/common.util';
import {
  getUpdateTimeByIndex,
  getUtcMillisecond,
} from 'common/utils/datetime.util';
import {
  buildItemResponseFail,
  buildSingleResponseErr,
} from 'common/utils/respond';
import { MeetingStatus } from 'entities/meeting.entity';
import { MeetingAttendeeRepository } from 'repositories/meeting-attendee.repository';
import { MeetingInfoRepository } from 'repositories/meeting-info.repository';
import { MeetingRepository } from 'repositories/meeting.repository';
import appConfig from '../../configs/app.config';
import { CreateAttendeeDTO } from './dtos/attendee.post.dto';
@Injectable()
export class AttendeeService {
  private readonly chime: AWS.Chime;
  constructor(private readonly meetingRepository: MeetingRepository,
    private readonly meetingInfoRepository: MeetingInfoRepository,
    private readonly meetingAttendeeRepository: MeetingAttendeeRepository
    ) {
    // Try cache for generate route
    try {
      // Create an AWS SDK Chime object. Region 'us-east-1' is currently required.
      // Use the MediaRegion property below in CreateMeeting to select the region
      // the meeting is hosted in.
      this.chime = new AWS.Chime({
        region: 'us-east-1',
      });
      // Set the AWS SDK Chime endpoint. The global endpoint is https://service.chime.aws.amazon.com.
      this.chime.endpoint = new AWS.Endpoint(process.env.CHIME_ENDPOINT);
    } catch (error) {
      //
    }
  }

  async getAttendee(params: GetAttendeeRequest): Promise<any> {
    try {
      return await this.chime.getAttendee(params).promise();
    } catch (error) {
      return new BadRequestException(error);
    }
  }

  async getListAttendee(params: ListAttendeesRequest): Promise<any> {
    try {
      return await this.chime.listAttendees(params).promise();
    } catch (error) {
      return new BadRequestException(error);
    }
  }

  async batchCreateAttendee(data: CreateAttendeeDTO, userId: number) {
    try {
      const itemFail = [];
      const domainFlo: string[] = appConfig().floDomain.split(',');
      let lstNonAttendees = [];
      let lstAttendees = [];
      const { MeetingId, Attendees, NonAttendees } = data;

      if (NonAttendees === undefined && Attendees === undefined) {
        const errRespond = buildSingleResponseErr(
          400,
          'Please fill list Attendee or Non attendee',
          data,
        );
        throw new BadRequestException(errRespond);
      }

      // filter dubplicate attendeees
      if (Attendees !== undefined) {
        // remove duplicate object
        const { uniqueArr: uniqueAttendee, dataError } =
          filterDuplicateItem(Attendees);
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
      if (combineAttendee?.length > appConfig().chimeLimit) {
        const itemFail = [];
        const errItem = buildItemResponseFail(
          ErrorMessage.VALIDATION_FAILED,
          `${MSG_ERR_CHIME_LIMIT}${appConfig().chimeLimit}`,
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

      const request = {
        MeetingId,
        Attendees: combineAttendee.map((item: string) => ({
          ExternalUserId: item,
        })),
      };
      const chimeService = this.chime
      const rs = await retryWithExponentialBackoff(async () => { return await chimeService.batchCreateAttendee(request).promise() })

      // filter list non users
      const rsAttendees: AttendeeList = rs.Attendees;
      const { filterAttendees, filterNonAttendees } = filterListAttendee(
        rsAttendees,
        lstNonAttendees,
      );
      
      // save attendee to db
      if (rsAttendees.length > 0) {
        await this.meetingAttendeeRepository.saveAttendees(data.MeetingId, rsAttendees, userId)
      }

      // save non user infor
      if (filterNonAttendees?.length > 0) {
        await this.storageNonUserInfor(data.MeetingId, filterNonAttendees);
      }

      return {
        data: { Attendees: filterAttendees, NonAttendees: filterNonAttendees },
        Errors: itemFail,
      };
    } catch (error) {
      throw error;
    }
  }


  async storageNonUserInfor(meetingId: string, lstNonAttendees: Attendee[]) {
    const currentTime = getUtcMillisecond();
    const entityNonAttendeeValid = [];
    // const chimeService = this.chime
    const meetingEntity = await this.meetingInfoRepository.findOneBy({
      meeting_id: meetingId,
      status: MeetingStatus.STARTED
    })
    // const meeting = await retryWithExponentialBackoff(async () => { return await chimeService
    //   .getMeeting({ MeetingId: meetingId })
    //   .promise(); })
    if (meetingEntity && meetingEntity?.media_placement) {
      const meetingConfig = {
        MeetingId: meetingId,
        ExternalMeetingId: meetingEntity.external_meeting_id,
        MediaPlacement: meetingEntity.media_placement,
        MediaRegion: meetingEntity.media_region
      }
      await Promise.all(
        lstNonAttendees.map(async (item: Attendee, idx: number) => {
          try {
            const dateItem = getUpdateTimeByIndex(currentTime, idx);
            const entityNonAttendee = this.meetingRepository.create({
              meeting_config: meetingConfig,
              meeting_id: meetingId,
              attendee_id: item.AttendeeId,
              external_attendee: item.ExternalUserId,
              join_token: item.JoinToken,
              created_date: dateItem,
              updated_date: dateItem,
            });
            entityNonAttendeeValid.push(entityNonAttendee);
          } catch (error) {
            throw error;
          }
        }),
      );
      await this.meetingRepository.insert(entityNonAttendeeValid);
    }
  }

  async deleteAttendee(params: DeleteAttendeeRequest): Promise<any> {
    try {
      return await this.chime.deleteAttendee(params).promise();
    } catch (error) {
      return error;
    }
  }
}