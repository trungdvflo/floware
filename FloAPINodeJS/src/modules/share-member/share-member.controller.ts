import {
  Body,
  Controller, Get, Post, Put, Query, Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBody, ApiTags
} from '@nestjs/swagger';
import { ShareMember } from '../../common/entities/share-member.entity';
import {
  BadRequestValidationFilter, UnknownExceptionFilter
} from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { nameSwagger } from '../../common/swaggers/share-member.swagger';
import {
  IDataRespond,
  MultipleRespond,
  ResponseMutiData as ResponseMultiData
} from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { UpdateStatusMemberDTO, UpdateStatusMemberSwagger } from './dtos/share-member-status.put.dto';
import { GetAllFilterMemberItem } from './dtos/share-member.get.dto';
import { CreateMemberDTO, CreateMemberSwagger } from './dtos/share-member.post.dto';
import { UpdateMemberDTO, UpdateMemberSwagger } from './dtos/share-member.put.dto';
import { UhShareSwagger, UnShareDTO } from './dtos/un-share.put.dto';
import { ShareMemberService } from './share-member.service';
@UseFilters(BadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@Controller(routestCtr.memberCtr.mainPath)
@ApiTags(nameSwagger)
export class ShareMemberController {
  constructor(
    private readonly shareMemberService: ShareMemberService,
  ) { }

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: ShareMember }))
    filter: GetAllFilterMemberItem<ShareMember>,
    @Req() req,
  ) {
    const dataRespond = await this.shareMemberService.getAllFiles(filter, req as IReq);
    return dataRespond;
  }

  @Get(routestCtr.memberCtr.byMember)
  async indexByMember(
    @Query(new GetAllValidationPipe({ entity: ShareMember }))
    filter: GetAllFilterMemberItem<ShareMember>,
    @Req() req,
  ) {
    const dataRespond = await this.shareMemberService.getAllByMember(filter, req.user.userId);
    return dataRespond;
  }

  @ApiBody({ type: CreateMemberSwagger })
  @Post()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async createFn(
    @Body(new BatchValidationPipe({ items: CreateMemberDTO, key: 'data' }))
    body: CreateMemberSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this
      .shareMemberService.createMember(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemPass.length > 0) {
      itemPass.map(itemMember => {
        delete itemMember['member_user_id'];
      });
    }
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;

    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @ApiBody({ type: UpdateMemberSwagger })
  @Put()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async UpdateFn(
    @Body(new BatchValidationPipe({ items: UpdateMemberDTO, key: 'data' }))
    body: UpdateMemberSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.shareMemberService.updateMember(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemPass.length > 0) {
      itemPass.map(itemMember => {
        delete itemMember['member_user_id'];
      });
    }
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;

    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @ApiBody({ type: UpdateStatusMemberSwagger })
  @Put(routestCtr.memberCtr.status)
  @UseInterceptors(HttpResponseCodeInterceptor)
  async UpdateStatusFn(
    @Body(new BatchValidationPipe({ items: UpdateStatusMemberDTO, key: 'data' }))
    body: UpdateStatusMemberSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.shareMemberService
      .updateStatusMember(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;

    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @ApiBody({ type: UhShareSwagger })
  @Put(routestCtr.memberCtr.unShare)
  @UseInterceptors(HttpResponseCodeInterceptor)
  async UnShare(
    @Body(new BatchValidationPipe({ items: UnShareDTO, key: 'data' }))
    body: UhShareSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    const result = await this.shareMemberService.unShareMember(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemPass.length > 0) {
      itemPass.map(itemMember => {
        delete itemMember['member_user_id'];
      });
    }
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMultiData(itemPass, errors);
  }
}
