import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Put,
  Req,
  UseInterceptors
} from '@nestjs/common';
import { ApiBadRequestResponse, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BatchValidationPipe } from 'src/common/pipes/validation.pipe';
import { SingleResponseCommonCode } from 'src/common/swaggers/common.swagger';
import { ErrorCode } from '../../common/constants/error-code';
import { HttpSingleResponseCodeInterceptor } from '../../common/interceptors';
import { IDataSingleRespond, SingleRespond, buildFailItemResponse } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { PutLastSeenDTOs, PutSettingDTO } from './dtos';
import { ChimeChatService, RealTimeService } from './services';

@ApiTags('Statistics')
@UseInterceptors(HttpSingleResponseCodeInterceptor)
@Controller(routestCtr.communicationCtr.realTime)
export class CommunicationController {
  constructor(
    private readonly realTimeService: RealTimeService,
    private readonly chimeChatService: ChimeChatService
  ) { }

  @Get(routestCtr.communicationCtr.statistics)
  @ApiOperation({
    summary: 'Get statistics for user',
    description: 'Get statistics realtime for user',
  })
  @ApiResponse({})
  @HttpCode(HttpStatus.OK)
  async getSocketToken(
    @Req() req) {
    const dataRespond: IDataSingleRespond = new Object();
    const statistics = await this.realTimeService
      .setHeader(req.headers)
      .getStatistics();

    const { data: chimeStatistic } = await this.chimeChatService
      .setHeader(req.headers)
      .getStatistics();

    if (!statistics && chimeStatistic) {
      dataRespond.error = [buildFailItemResponse(ErrorCode.BAD_REQUEST,
        "Can not get statistics", {})];
    } else {
      dataRespond.data = {
        ...statistics,
        minute_count: +(chimeStatistic.meeting_spent_time_in_seconds / 60).toFixed(3) || 0
      };
    }
    return new SingleRespond(dataRespond).singleData();
  }

  @Get(routestCtr.communicationCtr.socket)
  @ApiOperation({
    summary: 'Get statistics for user',
    description: 'Get statistics realtime for user',
  })
  @ApiResponse({})
  @HttpCode(HttpStatus.OK)
  async getStatistics(
    @Req() req) {
    const dataRespond: IDataSingleRespond = new Object();
    const token = await this.realTimeService
      .setHeader(req.headers)
      .getWsAccessToken();
    if (!token) {
      dataRespond.error = [buildFailItemResponse(ErrorCode.BAD_REQUEST,
        "Can not get socket url", {})];
    } else {
      dataRespond.data = token;
    }
    return new SingleRespond(dataRespond).singleData();
  }

  @Get(routestCtr.communicationCtr.settings)
  @ApiOperation({
    summary: 'Get statistics for user',
    description: 'Get statistics realtime for user',
  })
  @ApiResponse({})
  @HttpCode(HttpStatus.OK)
  async getSettings(
    @Req() req) {
    const dataRespond: IDataSingleRespond = new Object();
    const data = await this.realTimeService
      .setHeader(req.headers)
      .getChatSetting();
    if (!data) {
      dataRespond.error = [buildFailItemResponse(ErrorCode.BAD_REQUEST,
        "Can not get real-time settings", {})];
    } else {
      dataRespond.data = data;
    }
    return new SingleRespond(dataRespond).singleData();
  }

  @Put(routestCtr.communicationCtr.settings)
  @Put(routestCtr.chatCtr.message)
  @ApiOperation({
    summary: 'Update list of comments',
    description: 'Update list of comments',
  })
  @HttpCode(HttpStatus.OK)
  @ApiBadRequestResponse(SingleResponseCommonCode.RES_400)
  async updateMessage(
    @Body(new BatchValidationPipe({ items: PutSettingDTO, key: 'data', typeObj: 0 }))
    body: PutLastSeenDTOs,
    @Req() req) {
    try {
      const { data } = body;
      const rs = await this.realTimeService
        .setHeader(req.headers)
        .updateSettings(data);
      return new SingleRespond({ data }).singleData();
    } catch (err) {
      throw new Error('Can not update real-time setting');
    }

  }
}
