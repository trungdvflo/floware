import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post, Put, Query,
  Req,
  Res,
  UseInterceptors
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ResponseCode } from '../../common/constants/response-code';
import { ConferenceMemberEntity } from '../../common/entities/conference-member.entity';
import { ConferenceNonUserEntity } from '../../common/entities/conference-non-user.entity';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq, IUser } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe, SingleValidationPipe } from '../../common/pipes/validation.pipe';
import { IDataRespond, IDataSingleRespond, MultipleRespond, SingleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { ConferencingService } from './conference-channel.service';
import {
  CallPhoneDTO, CallPhoneDTOs, CheckChannelDtos,
  GetConferencePaging,
  RemoveAttendeeDTO, RemoveAttendeeDTOs
} from './dtos';
import { ChannelCreateDto, ChannelCreateDtos } from './dtos/channel.create.dto';
import { LeaveChannelDto, LeaveChannelDtos } from './dtos/channel.leave.dto';
import { MoveChannelDto, MoveChannelDtos } from './dtos/channel.move.dto';
import {
  ConferencingCreateResponse, ConferencingGetResponse, LeaveChannelResponse, MemberUpdateResponse
} from './dtos/channel.respone-sample.swagger';
import { ChimeDto } from './dtos/chime.dto';
import { MemberUpdateDto, MemberUpdateDtos } from './dtos/member.update.dto';
import { ScheduleDTOs } from './dtos/schedule.dto';
@ApiTags('Conferencing')
@UseInterceptors(HttpResponseCodeInterceptor)
@Controller(routestCtr.conferencingCtr.mainPath)
export class ConferencingController {
  constructor(
    private readonly conferencingService: ConferencingService
  ) { }

  @Get(routestCtr.conferencingCtr.validToken)
  async handleChimeConfig(@Query(new GetAllValidationPipe(
    { entity: ConferenceNonUserEntity })) chimeDto: ChimeDto, @Res() res,) {

    const resData = await this.conferencingService.validChimeToken(chimeDto);
    if (resData['error']) {
      return res.status(ResponseCode.INVALID_PAYLOAD_PARAMS).json(resData);
    }
    const rsData = new SingleRespond(resData).singleData();
    return res.status(ResponseCode.REQUEST_SUCCESS).json(rsData);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all channel',
    description:
      'Get all channel of this user',
  })
  @ApiResponse(ConferencingGetResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async index(
    @Query(new GetAllValidationPipe({ entity: ConferenceMemberEntity }))
    filter: GetConferencePaging<ConferenceMemberEntity>,
    @Req() req,
  ) {
    const dataRespond = await this.conferencingService
      .getAllChannels(filter, req as IReq);
    return dataRespond;
  }

  @Post(routestCtr.conferencingCtr.scheduleCall)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get time calling',
  })
  async getListSchedule(
    @Body(new SingleValidationPipe({ items: ScheduleDTOs, key: 'data' }))
    body: ScheduleDTOs, @Req() req,
  ) {
    const resData = await this.conferencingService.handleListScheduleCall(body.data, req as IReq);
    return new SingleRespond(resData).singleData();
  }

  @Post()
  @ApiOperation({
    summary: 'Create list of conferencing',
    description:
      'Create list of conferencing and return the creator\'s conferencing properties',
  })
  @ApiResponse(ConferencingCreateResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async createChannel(
    @Body(new BatchValidationPipe({ items: ChannelCreateDto, key: 'data' }))
    body: ChannelCreateDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const { itemPass, itemFail } = await this.conferencingService
      .createBatchChannel(data, req as IReq);
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @ApiOperation({
    summary: 'Update list of conference member',
    description:
      'Update list of conference member',
  })
  @Put()
  @ApiResponse(MemberUpdateResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async updateMember(
    @Body(new BatchValidationPipe({ items: MemberUpdateDto, key: 'data' }))
    body: MemberUpdateDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const { itemPass, itemFail } = await this.conferencingService
      .updateBatchMember(data, req as IReq);
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @ApiOperation({
    summary: 'Remove conference member',
    description:
      'Remove list of conference member',
  })
  @Post(`${routestCtr.conferencingCtr.deletePath}`)
  @ApiResponse(LeaveChannelResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async deleteChannelByMember(
    @Body(new BatchValidationPipe({ items: LeaveChannelDto, key: 'data' }))
    body: LeaveChannelDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const { itemPass, itemFail } = await this.conferencingService
      .deleteBatchMember(data, req as IReq);
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @ApiOperation({
    summary: 'Check channel exist by emails',
    description:
      'Check channel exist by emails',
  })
  @Post(`${routestCtr.conferencingCtr.checkChannel}`)
  @ApiResponse(LeaveChannelResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async checkChannel(
    @Body(new SingleValidationPipe({ items: CheckChannelDtos, key: 'data' }))
    body: CheckChannelDtos,
    @Req() req,
  ) {
    const { data, errors } = body;

    const dataRespond: IDataSingleRespond = new Object();
    if (errors) {
      dataRespond.error = errors;
    } else {
      const user: IUser = req.user;
      const { itemPass, itemFail } = await this.conferencingService
        .checkChannel(data, req as IReq);
      if (itemFail.length > 0) {
        dataRespond.error = { errors: itemFail };
      }
      if (itemPass.length > 0) {
        dataRespond.data = itemPass;
      }
    }
    return new SingleRespond(dataRespond).singleData();
  }

  @ApiOperation({
    summary: 'Move channel to collections',
    description: 'Move channel to collections',
  })
  @Post(`${routestCtr.conferencingCtr.moveChannel}`)
  @ApiResponse(LeaveChannelResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async moveChannel(
    @Body(new BatchValidationPipe({ items: MoveChannelDto, key: 'data' }))
    body: MoveChannelDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const { itemPass, itemFail } = await this.conferencingService
      .moveBatchChannel(data, req as IReq);
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @ApiOperation({
    summary: 'Call to a phone number',
    description: 'Call to a phone number',
  })
  @Post(routestCtr.conferencingCtr.callPhonePath)
  @HttpCode(HttpStatus.OK)
  async callPhone(
    @Body(new BatchValidationPipe({ items: CallPhoneDTO, key: 'data' }))
    body: CallPhoneDTOs,
    @Req() req) {
    const { data, errors = [] } = body;
    const { itemPass, itemFail } = await this.conferencingService.callPhone(data, req as IReq);
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @ApiOperation({
    summary: 'Remove a list of attendee',
    description: 'Remove a list of attendee',
  })
  @Post(routestCtr.conferencingCtr.removeAttendee)
  @HttpCode(HttpStatus.OK)
  async removeAttendee(
    @Body(new BatchValidationPipe({ items: RemoveAttendeeDTO, key: 'data' }))
    body: RemoveAttendeeDTOs,
    @Req() req) {
    const { data, errors = [] } = body;
    const { itemPass, itemFail } = await this.conferencingService.removeAttendee(data, req as IReq);
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