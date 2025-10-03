import {
  Body,
  Controller, Get, Post, Put, Query, Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBody, ApiTags
} from '@nestjs/swagger';
import { GetAllFilter4Collection } from '../../common/dtos/get-all-filter';
import { CollectionInstanceMember } from '../../common/entities/collection-instance-member.entity';
import {
  BadRequestValidationFilter, UnknownExceptionFilter
} from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { nameInstanceMemberSwagger } from '../../common/swaggers/collection.swagger';
import {
  IDataRespond,
  MultipleRespond,
  ResponseMutiData
} from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { CollectionInstanceMemberService } from './collection-instance-member.service';
import { DeleteCollectionInstanceMemberDTO, DeleteCollectionInstanceMemberSwagger } from './dtos/collection-instance-member.delete.dto';
import { CreateCollectionInstanceMemberDTO, CreateCollectionInstanceMemberSwagger } from './dtos/collection-instance-member.post.dto';
import { UpdateCollectionInstanceMemberDTO, UpdateCollectionInstanceMemberSwagger } from './dtos/collection-instance-member.put.dto';
@UseFilters(BadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@Controller(routestCtr.collectionInstanceMemberCtr.mainPath)
@ApiTags(nameInstanceMemberSwagger)
export class CollectionInstanceMemberController {
  constructor(
    private readonly instanceService: CollectionInstanceMemberService,
  ) { }

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: CollectionInstanceMember }))
    filter: GetAllFilter4Collection<CollectionInstanceMember>,
    @Req() req,
  ) {
    const dataRespond = await this.instanceService.getAllFiles(filter, req as IReq);
    return dataRespond;
  }

  @ApiBody({ type: CreateCollectionInstanceMemberSwagger })
  @Post()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async createFn(
    @Body(new BatchValidationPipe({ items: CreateCollectionInstanceMemberDTO, key: 'data' }))
    body: CreateCollectionInstanceMemberSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.instanceService.createInstanceMember(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMutiData(itemPass, errors);
  }

  @ApiBody({ type: UpdateCollectionInstanceMemberSwagger })
  @Put()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async UpdateFn(
    @Body(new BatchValidationPipe({ items: UpdateCollectionInstanceMemberDTO, key: 'data' }))
    body: UpdateCollectionInstanceMemberSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.instanceService.updateInstanceMember(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMutiData(itemPass, errors);
  }

  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiBody({ type: DeleteCollectionInstanceMemberSwagger })
  @Post(routestCtr.collectionInstanceMemberCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: DeleteCollectionInstanceMemberDTO, key: 'data' }))
    body: DeleteCollectionInstanceMemberSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.instanceService.deleteInstanceBatch(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMutiData(itemPass, errors);
  }
}
