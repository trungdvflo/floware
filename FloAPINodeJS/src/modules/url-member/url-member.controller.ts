import {
  Body,
  Controller, Get, Post, Put, Query, Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiOperation, ApiTags
} from '@nestjs/swagger';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { Url } from '../../common/entities/urls.entity';
import {
  BadRequestValidationFilter
} from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import {
  MultipleRespond,
  ResponseMutiData
} from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { UrlMembersCreateDto, UrlMembersCreateDtos } from './dtos/url-member.create.dto';
import { UrlMemberDeleteDto, UrlMemberDeleteDtos } from './dtos/url-member.delete.dto';
import { UrlMembersUpdateDto, UrlMembersUpdateDtos } from './dtos/url-member.update.dto';
import { UrlMembersService } from './url-member.service';

@ApiTags('Member URL Bookmark')
@UseFilters(BadRequestValidationFilter)
@Controller(routestCtr.urlMemberCtr.mainPath)
export class UrlMembersController {
  constructor(
    private readonly urlMembersService: UrlMembersService,
  ) { }

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: Url }))
    filter: GetAllFilter<Url>,
    @Req() req,
  ) {
    const dataRespond = await this
      .urlMembersService.getAll(filter, req as IReq);
    return dataRespond;
  }

  @Post()
  @ApiOperation({
    summary: 'Create list of url-members bookmark',
    description: 'Create url-members records with data sent from client',
  })
  @UseInterceptors(HttpResponseCodeInterceptor)
  async create(
    @Body(new BatchValidationPipe({ items: UrlMembersCreateDto, key: 'data' }))
    body: UrlMembersCreateDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      const dataRespond: any = { errors };
      return new MultipleRespond(dataRespond).multipleRespond();
    }

    const res = await this.urlMembersService.saveBatch(data, errors, req as IReq);
    return new ResponseMutiData(res.results, res.errors);
  }

  @Put()
  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiOperation({
    summary: 'Update list of url-members Bookmark',
    description: 'Update url-members records with id and data sent from client',
  })
  async update(
    @Body(new BatchValidationPipe({ items: UrlMembersUpdateDto, key: 'data' }))
    body: UrlMembersUpdateDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      const dataRespond: any = { errors };
      return new MultipleRespond(dataRespond).multipleRespond();
    }

    const uniqueData = data.filter((v, i, a) =>
      a.findIndex(t => (t.id === v.id && t.collection_id === v.collection_id)) === i
    );

    const res = await this.urlMembersService.updateBatch(uniqueData, errors, req as IReq);
    return new ResponseMutiData(res.results, res.errors);
  }

  @Post(routestCtr.urlMemberCtr.deletePath)
  @ApiOperation({
    summary: 'Delete list of url-members bookmark',
    description: 'Delete url-members records with data sent from client',
  })
  @UseInterceptors(HttpResponseCodeInterceptor)
  async delete(
    @Body(new BatchValidationPipe({ items: UrlMemberDeleteDto, key: 'data' }))
    body: UrlMemberDeleteDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      const dataRespond: any = { errors };
      return new MultipleRespond(dataRespond).multipleRespond();
    }

    const uniqueData = data.filter((v, i, a) =>
      a.findIndex(t => (t.id === v.id && t.collection_id === v.collection_id)) === i
    );

    const res = await this.urlMembersService.deleteBatch(uniqueData, errors, req as IReq);
    return new ResponseMutiData(res.results, res.errors);
  }

}
