import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import { RequestBody } from 'common/decorators/request-body.decorator';
import { HttpSingleResponseCodeInterceptor } from 'common/interceptors/http-response-code-single-response.interceptor';
import { buildSingleResponseErr } from 'common/utils/respond';
import { routestCtr } from 'configs/routes.config';
import { AttendeeService } from './attendee.service';
import { CreateAttendeeDTO } from './dtos/attendee.post.dto';
@Controller(routestCtr.attendeeCtr.mainPath)
export class AttendeeController {
  constructor(private readonly attendeeService: AttendeeService) {}

  @Post()
  @UseInterceptors(HttpSingleResponseCodeInterceptor)
  async CreateAttendee(@RequestBody(CreateAttendeeDTO) dataDTO, @Req() req) {
    if (dataDTO.statusCode === 400) {
      const errRespond = buildSingleResponseErr(
        dataDTO.statusCode,
        dataDTO.message,
      );
      throw new BadRequestException(errRespond);
    }
    const { data, Errors } = await this.attendeeService.batchCreateAttendee(
      dataDTO['attributes'],
      req.user.id
    );
    return { data, Errors };
  }
}
