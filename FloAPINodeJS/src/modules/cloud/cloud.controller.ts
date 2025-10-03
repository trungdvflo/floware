import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBadRequestResponse, ApiBody, ApiOperation, ApiTags
} from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { OBJ_TYPE } from '../../common/constants';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { Cloud } from '../../common/entities/cloud.entity';
import {
  BadRequestValidationFilter,
  BaseBadRequestValidationFilter,
  UnknownExceptionFilter
} from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { IObjectOrder } from '../../common/interfaces/object-order.interface';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { nameSwagger } from '../../common/swaggers/cloud.swagger';
import {
  SingleResponseCommonCode
} from '../../common/swaggers/common.swagger';
import {
  DataRespond,
  IDataRespond,
  MultipleRespond, SingleRespond
} from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { CustomSortObjectDto } from '../sort-object/dto/sort-object.dto';
import { SortObjectService } from '../sort-object/sort-object.service';
import { ApiOperationInfo } from '../sort-object/sort-object.swagger';
import { UpdateSortObjectNotTodoDto } from '../todo/dtos/update-sort-object.dto';
import { CloudService } from './cloud.service';
import {
  CreateCloudDTO, CreateCloudSwagger,
  DeleteCloudDTO, DeleteCloudSwagger,
  UpdateCloudDTO, UpdateCloudSwagger
} from "./dtos";
@UseFilters(BadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@Controller(routestCtr.cloudCtr.mainPath)
@ApiTags(nameSwagger)
export class CloudController {
  constructor(
    private readonly cloudService: CloudService,
    private readonly sortObjectService: SortObjectService,
  ) { }

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: Cloud }))
    filter: GetAllFilter<Cloud>,
    @Req() req,
  ) {
    const dataRespond = await this.cloudService.getAllFiles(filter, req as IReq);
    return dataRespond;
  }

  @ApiBody({ type: CreateCloudSwagger })
  @Post()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async createFn(
    @Body(new BatchValidationPipe({ items: CreateCloudDTO, key: 'data' }))
    body: CreateCloudSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.cloudService.createCloud(data, req as IReq);
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
  @ApiBody({ type: UpdateCloudSwagger })
  @Put()
  async putFn(
    @Body(new BatchValidationPipe({ items: UpdateCloudDTO, key: 'data' }))
    body: DataRespond,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.cloudService.updateCloud(data, req as IReq);
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
  @ApiBody({ type: DeleteCloudSwagger })
  @Post(routestCtr.cloudCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: DeleteCloudDTO, key: 'data' }))
    body: DeleteCloudSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.cloudService.deleteCloud(data, req as IReq);
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
  @ApiBody({ type: UpdateSortObjectNotTodoDto })
  @Put(routestCtr.cloudCtr.sortPath)
  public async updateObjectOrderFn(
    @Body(new BatchValidationPipe({ items: CustomSortObjectDto, key: 'data' }))
    body: DataRespond,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const request_uid = uuidv4();
    const cloudObjectOrder: IObjectOrder = {
      data,
      object_type: OBJ_TYPE.CSFILE,
    };

    const result = await this.sortObjectService
      .setCloudObjectOrder(cloudObjectOrder, req.user, request_uid);

    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    const dataRespond: IDataRespond = new Object();
    if (itemPass.length > 0) {
      dataRespond.request_uid = request_uid;
      dataRespond.data = itemPass;
    }
    if (errors.length > 0) dataRespond.errors = errors;

    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @UseFilters(BaseBadRequestValidationFilter)
  @Put(routestCtr.cloudCtr.resetOrderPath)
  @ApiOperation(ApiOperationInfo.reset)
  @ApiBadRequestResponse(SingleResponseCommonCode.RES_400)
  public async reset(@Req() req) {
    try {
      const rs = await this.sortObjectService.resetOrder(
        req,
        OBJ_TYPE.CSFILE.toString(),
      );
      return new SingleRespond(rs).singleData();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }
  }
}
