import {
  Body,
  Controller, Get, Post, Put, Query, Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBody, ApiTags
} from '@nestjs/swagger';
import { GetAllFilter } from '../../../common/dtos/get-all-filter';
import { SystemCollection } from '../../../common/entities/collection-system.entity';
import {
  BadRequestValidationFilter, UnknownExceptionFilter
} from '../../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../../common/pipes/validation.pipe';
import { nameSwagger } from '../../../common/swaggers/system-collection.swagger';
import {
  IDataRespond,
  MultipleRespond
} from '../../../common/utils/respond';
import { routestCtr } from '../../../configs/routes';
import {
  CreateSystemCollectionDTO, CreateSystemCollectionSwagger,
  DeleteSystemCollectionDTO, DeleteSystemCollectionSwagger,
  UpdateSystemCollectionDTO, UpdateSystemCollectionSwagger
} from './dtos';
import { SystemCollectionService } from './system-collection.service';

@UseFilters(BadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@Controller(routestCtr.systemcollectionCtr.mainPath)
@ApiTags(nameSwagger)
export class SystemCollectionController {
  constructor(
    private readonly systemCollectionService: SystemCollectionService,
  ) { }

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: SystemCollection }))
    filter: GetAllFilter<SystemCollection>,
    @Req() req,
  ) {
    const dataRespond = await this.systemCollectionService.getAllFiles(filter, req.user.userId);
    return dataRespond;
  }

  @ApiBody({ type: CreateSystemCollectionSwagger })
  @Post()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async createFn(
    @Body(new BatchValidationPipe({ items: CreateSystemCollectionDTO, key: 'data' }))
    body: CreateSystemCollectionSwagger, @Req() req) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.systemCollectionService.createSystemCollection(data, req as IReq);
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

  @ApiBody({ type: UpdateSystemCollectionSwagger })
  @Put()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async UpdateFn(
    @Body(new BatchValidationPipe({ items: UpdateSystemCollectionDTO, key: 'data' }))
    body: UpdateSystemCollectionSwagger, @Req() req) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.systemCollectionService.updateSystemCollection(data, req as IReq);
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

  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiBody({ type: DeleteSystemCollectionSwagger })
  @Post(routestCtr.systemcollectionCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: DeleteSystemCollectionDTO, key: 'data' }))
    body: DeleteSystemCollectionSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.systemCollectionService.deleteSystemCollection(data, req as IReq);
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
}
