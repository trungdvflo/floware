import {
  Body,
  Controller,
  HttpCode, HttpStatus, Post,
  Req,
  UseInterceptors
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { HttpResponseCodeInterceptor } from '../../common/interceptors';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe } from '../../common/pipes/validation.pipe';
import { nameSwagger } from '../../common/swaggers/conference-history.swagger';
import { IDataRespond, MultipleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { ConferenceInviteRealtimeService } from './conference-invite.realtime.service';
import { ConferenceInviteService } from './conference-invite.service';
import { InviteSilentPushDTO, InviteSilentPushDTOs } from './dtos/invite.silent-push.dto';
import { ReplySilentPushDTO, ReplySilentPushDTOs } from './dtos/reply.silent-push.dto';

@Controller(routestCtr.conferencingCtr.mainPath)
@UseInterceptors(HttpResponseCodeInterceptor)
@ApiTags(nameSwagger)
export class ConferenceInviteController {
  constructor(
    private readonly confInviteService: ConferenceInviteService,
    private readonly confInviteRealtimeService: ConferenceInviteRealtimeService,
  ) { }

  @ApiBody({ type: InviteSilentPushDTOs })
  @Post(routestCtr.conferencingCtr.invitePath)
  async sendInvite(
    @Body(new BatchValidationPipe({ items: InviteSilentPushDTO, key: 'data', typeObj: 0 }))
    body: InviteSilentPushDTOs, @Req() req) {

    const { data, errors = [] } = body;
    if (!data) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const { itemPass, itemFail } = await this.confInviteService.sendInvite(data, req as IReq);
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond(HttpStatus.CREATED);
  }

  @ApiBody({ type: ReplySilentPushDTOs })
  @Post(routestCtr.conferencingCtr.replyPath)
  @HttpCode(HttpStatus.OK)
  async replySendInvite(
    @Body(new BatchValidationPipe({ items: ReplySilentPushDTO, key: 'data', typeObj: 0 }))
    body: ReplySilentPushDTOs,
    @Req() req) {
    const { data, errors = [] } = body;
    const { itemPass, itemFail } = await this.confInviteService.replyInvite(data, req as IReq);
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @ApiBody({ type: InviteSilentPushDTOs })
  @Post(routestCtr.conferencingCtr.invitePathRealtime)
  async sendInviteRealTime(
    @Body(new BatchValidationPipe({ items: InviteSilentPushDTO, key: 'data', typeObj: 0 }))
    body: InviteSilentPushDTOs, @Req() req) {
    const { data, errors = [] } = body;
    if (!data) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const { itemPass, itemFail } = await this.confInviteRealtimeService
      .sendInvite(data, req as IReq);
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond(HttpStatus.CREATED);
  }

  @ApiBody({ type: ReplySilentPushDTOs })
  @Post(routestCtr.conferencingCtr.replyPathRealtime)
  @HttpCode(HttpStatus.OK)
  async replySendInviteRealTime(
    @Body(new BatchValidationPipe({ items: ReplySilentPushDTO, key: 'data', typeObj: 0 }))
    body: ReplySilentPushDTOs,
    @Req() req) {
    const { data, errors = [] } = body;
    const { itemPass, itemFail } = await this.confInviteRealtimeService
      .replyInvite(data, req as IReq);
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond();
  }
}
