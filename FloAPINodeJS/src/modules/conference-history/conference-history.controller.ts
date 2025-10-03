import {
  Body,
  Controller, Get,
  Post, Put, Query, Req,
  UseInterceptors
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { ConferenceHistoryEntity } from '../../common/entities/conference-history.entity';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { nameSwagger } from '../../common/swaggers/conference-history.swagger';
import { ResponseMutiData } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { ConferenceHistoryService } from './conference-history.service';
import {
  CreateConferenceHistoryDTO, CreateConferenceHistorySwagger,
  DeleteConferenceHistoryDTO, DeleteConferenceHistorySwagger,
  GetConferenceHistoryPaging, ReplyConferenceHistoryDTO,
  ReplyConferenceHistorySwagger, UpdateConferenceHistoryDTO,
  UpdateConferenceHistorySwagger
} from './dtos';

@UseInterceptors(HttpResponseCodeInterceptor)
@Controller(routestCtr.conferenceHistoryCtr.mainPath)
@ApiTags(nameSwagger)
export class ConferenceHistoryController {
  constructor(
    private readonly confHistoryService: ConferenceHistoryService,
  ) { }

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: ConferenceHistoryEntity }))
    filter: GetConferenceHistoryPaging<ConferenceHistoryEntity>,
    @Req() req,
  ) {
    const dataRespond = await this.confHistoryService
      .getAll(filter, req as IReq);
    return dataRespond;
  }

  @ApiBody({ type: CreateConferenceHistorySwagger })
  @Post()
  async Create(
    @Body(new BatchValidationPipe({ items: CreateConferenceHistoryDTO, key: 'data' }))
    body: CreateConferenceHistorySwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new ResponseMutiData([], errors);
    }

    const result = await this.confHistoryService.create(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMutiData(itemPass, errors);
  }

  @ApiBody({ type: UpdateConferenceHistorySwagger })
  @Put()
  async Update(
    @Body(new BatchValidationPipe({ items: UpdateConferenceHistoryDTO, key: 'data' }))
    body: UpdateConferenceHistorySwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new ResponseMutiData([], errors);
    }

    const result = await this.confHistoryService.update(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMutiData(itemPass, errors);
  }

  @ApiBody({ type: DeleteConferenceHistorySwagger })
  @Post(routestCtr.conferenceHistoryCtr.deletePath)
  async Delete(
    @Body(new BatchValidationPipe({ items: DeleteConferenceHistoryDTO, key: 'data' }))
    body: DeleteConferenceHistorySwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new ResponseMutiData([], errors);
    }

    const result = await this.confHistoryService.delete(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMutiData(itemPass, errors);
  }

  @ApiBody({ type: ReplyConferenceHistorySwagger })
  @Post(routestCtr.conferenceHistoryCtr.replyPath)
  async Reply(
    @Body(new BatchValidationPipe({ items: ReplyConferenceHistoryDTO, key: 'data' }))
    body: ReplyConferenceHistorySwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new ResponseMutiData([], errors);
    }
    const result = await this.confHistoryService.reply(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    return new ResponseMutiData(itemPass, errors);
  }
}
