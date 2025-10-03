import {
  Controller,
  Get,
  Query,
  Req,
  UseInterceptors,
  UsePipes
} from '@nestjs/common';

import {
  BatchValidationPipe
} from 'common/fliters/validation.pipe';
import { HttpResponseCodeInterceptor } from 'common/interceptors/http-response-code-single-response.interceptor.chatting';
import { routestCtr } from 'configs/routes.config';
import { ChannelService } from './channel.service';
import { GetChannelDTO } from './dtos/channel.get.dto';

@UseInterceptors(HttpResponseCodeInterceptor)
@UsePipes(new BatchValidationPipe())
@Controller(routestCtr.channelCtr.mainPath)
export class ChannelController {
  constructor(private readonly channelService: ChannelService) { }

  @Get(routestCtr.channelCtr.statusPath)
  async ListStatusMeeting(@Query() data: GetChannelDTO, @Req() req) {
    if (data.channel_id !== undefined) {
      if (data.channel_id.toString().trim() == '') {
        return {
          error: {
            code: "badRequest",
            message: "channel_id must be an integer number"
          }
        }
      }
      return this.channelService.getStatusMeetingByChannel(data, req.user);
    }
    return this.channelService.getStatusMeeting(req.user);
  }
}
