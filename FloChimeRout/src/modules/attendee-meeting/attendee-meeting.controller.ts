import {
  Controller,
  Delete,
  Get,
  Param,
  Query,
  UsePipes,
} from '@nestjs/common';
import { routestCtr } from 'configs/routes.config';
import { MeetingParamDTO } from '../../dto/meeting.param.dto';
import { AttendeeParamDTO } from '../../dto/attendee.param.dto';
import { AttendeeMeetingService } from './attendee-meeting.service';
import { ListAttendeeQueryDTO } from './dtos/attendee-meeting.list.dto';
import { ListAttendeesRequest } from 'aws-sdk/clients/chime';
import { CommonValidationPipe } from 'common/utils/common.util';

@UsePipes(new CommonValidationPipe({ transform: true }))
@Controller(routestCtr.attendeeMeetingCtr.mainPath)
export class AttendeeMeetingController {
  constructor(private readonly attendeeService: AttendeeMeetingService) {}

  @Get(routestCtr.attendeeMeetingCtr.getPath)
  async get(@Param() params: AttendeeParamDTO): Promise<object> {
    return this.attendeeService.getAttendee(params);
  }

  @Get(routestCtr.attendeeMeetingCtr.getListPath)
  async getList(
    @Param() params: MeetingParamDTO,
    @Query() query: ListAttendeeQueryDTO,
  ): Promise<object> {
    const p: ListAttendeesRequest = {
      MeetingId: params.MeetingId,
      MaxResults: query['max-result'],
      NextToken: query['next-token'],
    };
    return this.attendeeService.getListAttendee(p);
  }

  @Delete(routestCtr.attendeeMeetingCtr.deletePath)
  async delete(@Param() params: AttendeeParamDTO): Promise<object> {
    return this.attendeeService.deleteAttendee(params);
  }
}
