import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
  Req,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { RequestBody } from 'common/decorators/request-body.decorator';
import { HttpSingleResponseCodeInterceptor } from 'common/interceptors/http-response-code-single-response.interceptor';
import { buildSingleResponseErr } from 'common/utils/respond';
import { routestCtr } from 'configs/routes.config';
import { DeleteMeetingDTO } from './dtos/meeting.delete.dto';
import { MeetingDialDTO } from './dtos/meeting.dial.dto';
import { GetActivityQuery, GetMeetingDTO } from './dtos/meeting.get.dto';
import { CreateMeetingDTO } from './dtos/meeting.post.dto';
import { MeetingService } from './meeting.service';

@Controller(routestCtr.meetingCtr.mainPath)
export class MeetingController {
  constructor(private readonly meetingService: MeetingService) { }

  @UseInterceptors(HttpSingleResponseCodeInterceptor)
  @Post()
  async createMeetingWithAttendee(
    @RequestBody(CreateMeetingDTO) dataDTO,
    @Req() req,
  ) {
    if (dataDTO.statusCode === 400) {
      const errRespond = buildSingleResponseErr(
        dataDTO.statusCode,
        dataDTO.message,
      );
      throw new BadRequestException(errRespond);
    }
    const { data, Errors } =
      await this.meetingService.createMeetingWithAttendee(
        dataDTO['attributes'],
        req,
      );
    return { data, Errors };
  }

  @Get(routestCtr.meetingCtr.statisticsPath)
  @UsePipes(new ValidationPipe({ transform: true }))
  async statistics(@Req() req ) {
    return await this.meetingService.statistics(req.user.email);
  }
  
  @Get(routestCtr.meetingCtr.activityPath)
  @UsePipes(new ValidationPipe({ transform: true }))
  getActivities(@Query() data: GetActivityQuery): object {
    return this.meetingService.getActivities(data.channel_id);
  }

  @Get(routestCtr.meetingCtr.getPath)
  @UsePipes(new ValidationPipe({ transform: true }))
  getById(@Param() data: GetMeetingDTO): object {
    return this.meetingService.getMeetingById(data.MeetingId);
  }

  @Delete(routestCtr.meetingCtr.deletePath)
  @UsePipes(new ValidationPipe({ transform: true }))
  @HttpCode(204)
  deleteById(@Param() data: DeleteMeetingDTO, @Req() req): object {
    return this.meetingService.deleteMeeting(data.MeetingId);
  }

  @Post(routestCtr.meetingCtr.callPhonePath)
  async dial( 
    @RequestBody(MeetingDialDTO) requestDto,
    @Req() req
  ) {
    
    if (requestDto.statusCode === 400) {
      const errRespond = buildSingleResponseErr(
        requestDto.statusCode,
        requestDto.message,
      );
      throw new BadRequestException(errRespond);
    }
    const callPhoneRes = await this.meetingService.callPhoneFromMeeting(requestDto.attributes.MeetingId, requestDto.attributes.PhoneNumber);
    await this.meetingService.savePhoneAttendee(
      requestDto.attributes.MeetingId, 
      requestDto.attributes.PhoneNumber, 
      callPhoneRes.data.attendee.Attendee,
      req.user.id)
    
    return callPhoneRes;
  }
}
