import { BadRequestException, Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import {
  DeleteAttendeeRequest,
  GetAttendeeRequest,
  ListAttendeesRequest
} from 'aws-sdk/clients/chime';
import { retryWithExponentialBackoff } from 'common/utils/chime.util';
import { SingleError } from 'common/utils/respond';
import { MeetingStatus } from 'entities/meeting.entity';
import { MeetingAttendeeRepository } from 'repositories/meeting-attendee.repository';
import { MeetingInfoRepository } from 'repositories/meeting-info.repository';
import { MeetingRepository } from 'repositories/meeting.repository';
import { DeleteResult } from 'typeorm';

@Injectable()
export class AttendeeMeetingService {
  private readonly chime: AWS.Chime;
  constructor(
    private readonly meetingRepository: MeetingRepository,
    private readonly meetingAttendeeRepository: MeetingAttendeeRepository,
    private readonly meetingInfoRepository: MeetingInfoRepository
  ) {
    // Try cache for generate route
    try {
      // Create an AWS SDK Chime object. Region 'us-east-1' is currently required.
      // Use the MediaRegion property below in CreateMeeting to select the region
      // the meeting is hosted in.
      this.chime = new AWS.Chime({
        region: process.env.CHIME_REGION
          ? process.env.CHIME_REGION
          : 'us-east-1',
      });
      // Set the AWS SDK Chime endpoint. The global endpoint is https://service.chime.aws.amazon.com.
      this.chime.endpoint = new AWS.Endpoint(process.env.CHIME_ENDPOINT);
    } catch (error) {
      //
    }
  }

  async getAttendee(params: GetAttendeeRequest): Promise<any> {
    try {
      const meeting = await this.meetingInfoRepository.findOneBy({
        meeting_id: params.MeetingId,
        status: MeetingStatus.STARTED
      })
      if (meeting?.id) {
        const atteendee = await this.meetingAttendeeRepository.findOneBy({
          meeting_id: params.MeetingId,
          attendee_id: params.AttendeeId
        });
        if (atteendee?.id) {
          return {
            data: {
              Attendee: {
                ExternalUserId: atteendee.user_email,
                AttendeeId: atteendee.attendee_id,
                JoinToken: atteendee.join_token
              }
            },
          };
        }
      }

      const chimeService = this.chime
      const chimeRes = await retryWithExponentialBackoff(async () => { return await chimeService.getAttendee(params).promise() })
      if (!chimeRes.Attendee) {
        throw new BadRequestException(
          new SingleError(chimeRes.$response.error),
        );
      }
      return {
        data: chimeRes,
      };
    } catch (error) {
      throw error;
    }
  }

  async getListAttendee(params: ListAttendeesRequest): Promise<any> {
    try {
      const chimeService = this.chime
      const chimeRes = await retryWithExponentialBackoff(async () => { return await chimeService.listAttendees(params).promise() })
      if (!chimeRes.Attendees) {
        throw new BadRequestException(
          new SingleError(chimeRes.$response.error),
        );
      }
      return {
        data: { ...chimeRes },
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteAttendee(params: DeleteAttendeeRequest): Promise<any> {
    try {
      const chimeService = this.chime
      const chimeRes = await retryWithExponentialBackoff(async () => {
        return await chimeService.deleteAttendee(params).promise()
      })
      // delete non attendee
      await this.meetingRepository.delete({
        meeting_id: params.MeetingId,
        attendee_id: params.AttendeeId,
      });
      // delete
      const rs: DeleteResult = await this.meetingAttendeeRepository.delete({
        meeting_id: params.MeetingId,
        attendee_id: params.AttendeeId
      });

      if (chimeRes.$response.error) {
        throw new BadRequestException(
          new SingleError(chimeRes.$response.error),
        );
      }
      if (!rs.affected) {
        throw new BadRequestException(
          new SingleError('Attendee has already deleted.'),
        );
      }

      return {
        data: { ...chimeRes },
      };
    } catch (error) {
      throw error;
    }
  }
}
