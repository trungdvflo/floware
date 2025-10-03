import {
  Body,
  Controller, Get, Post, Put, Query, Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { ConferenceMemberEntity } from '../../common/entities/conference-member.entity';
import { BaseBadRequestValidationFilter } from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { nameSwagger } from '../../common/swaggers/conference-member.swagger';
import { ResponseMutiData } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { ConferenceMemberService } from './conference-member.service';
import {
  CreateConferenceMemberDTO, CreateConferenceMemberSwagger,
  DeleteConferenceMemberDTO, DeleteConferenceMemberSwagger,
  UpdateConferenceMemberDTO, UpdateConferenceMemberSwagger
} from './dtos';

@UseFilters(BaseBadRequestValidationFilter)
@Controller(routestCtr.conferenceMemberCtr.mainPath)
@ApiTags(nameSwagger)
export class ConferenceMemberController {
  constructor(
    private readonly confMemService: ConferenceMemberService,
  ) { }

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: ConferenceMemberEntity }))
    filter: GetAllFilter<ConferenceMemberEntity>,
    @Req() req,
  ) {
    const dataRespond = await this.confMemService.getAll(filter, req.user.userId);
    return dataRespond;
  }

  @ApiBody({ type: CreateConferenceMemberSwagger })
  @Post()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async Create(
    @Body(new BatchValidationPipe({ items: CreateConferenceMemberDTO, key: 'data' }))
    body: CreateConferenceMemberSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new ResponseMutiData([], errors);
    }

    const result = await this.confMemService.create(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMutiData(itemPass, errors);
  }

  @ApiBody({ type: UpdateConferenceMemberSwagger })
  @Put()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async Update(
    @Body(new BatchValidationPipe({ items: UpdateConferenceMemberDTO, key: 'data' }))
    body: UpdateConferenceMemberSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new ResponseMutiData([], errors);
    }

    const result = await this.confMemService.update(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMutiData(itemPass, errors);
  }

  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiBody({ type: DeleteConferenceMemberSwagger })
  @Put(routestCtr.conferenceMemberCtr.removePath)
  async Remove(
    @Body(new BatchValidationPipe({ items: DeleteConferenceMemberDTO, key: 'data' }))
    body: DeleteConferenceMemberSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new ResponseMutiData([], errors);
    }

    const result = await this.confMemService.remove(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMutiData(itemPass, errors);
  }
}
