import {
  Body,
  Controller, Get, Post, Put, Query, Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBody, ApiTags
} from '@nestjs/swagger';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { SuggestedCollection } from '../../common/entities/suggested_collection.entity';
import {
  BadRequestValidationFilter, UnknownExceptionFilter
} from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { nameSuggestedCollectionSwagger } from '../../common/swaggers/collection.swagger';
import {
  IDataRespond,
  MultipleRespond,
  ResponseMutiData
} from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { DeleteSeggestedCollectionDTO, DeleteSeggestedCollectionSwagger } from './dtos/suggested_collection.delete.dto';
import { CreateSuggestedCollectionDTO, CreateSuggestedCollectionSwagger } from './dtos/suggested_collection.post.dto';
import { UpdateSuggestedCollectionDTO, UpdateSuggestedCollectionSwagger } from './dtos/suggested_collection.put.dto';
import { SuggestedCollectionService } from './suggested_collection.service';
@UseFilters(BadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@Controller(routestCtr.suggestedCollectionCtr.mainPath)
@ApiTags(nameSuggestedCollectionSwagger)
export class SeggestedCollectionController {
  constructor(
    private readonly suggCollectionService: SuggestedCollectionService,
  ) {}

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: SuggestedCollection }))
    filter: GetAllFilter<SuggestedCollection>,
    @Req() req,
  ) {
    const dataRespond = await this.suggCollectionService.getAll(filter, req as IReq);
    return dataRespond;
  }

  @ApiBody({ type: CreateSuggestedCollectionSwagger })
  @Post()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async CreateFn(
    @Body(new BatchValidationPipe({ items: CreateSuggestedCollectionDTO, key: 'data' }))
    body: CreateSuggestedCollectionSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.suggCollectionService.createBatch(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMutiData(itemPass, errors);
  }

  @ApiBody({ type: UpdateSuggestedCollectionSwagger })
  @Put()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async UpdateFn(
    @Body(new BatchValidationPipe({ items: UpdateSuggestedCollectionDTO, key: 'data' }))
    body: UpdateSuggestedCollectionSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.suggCollectionService.updateBatch(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMutiData(itemPass, errors);
  }

  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiBody({ type: DeleteSeggestedCollectionSwagger })
  @Post(routestCtr.suggestedCollectionCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: DeleteSeggestedCollectionDTO, key: 'data' }))
    body: DeleteSeggestedCollectionSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.suggCollectionService.deleteInstanceBatch(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMutiData(itemPass, errors);
  }
}
