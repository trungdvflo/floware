import {
    BadRequestException,
    Body,
    Controller,
    Get, Post,
    Put,
    Query,
    Req, UseFilters,
    UseInterceptors
} from '@nestjs/common';
import {
    ApiBadRequestResponse, ApiBody, ApiOkResponse,
    ApiOperation, ApiTags
} from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { OBJ_TYPE } from '../../common/constants';
import { GetAllFilterSortItem } from '../../common/dtos/get-all-filter';
import { SortObject } from '../../common/entities/sort-object.entity';
import {
    BadRequestValidationFilter,
    BaseBadRequestValidationFilter,
    UnknownExceptionFilter
} from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { ITodoObjectOrder } from '../../common/interfaces/object-order.interface';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { SingleResponseCommonCode } from '../../common/swaggers/common.swagger';
import {
    DataRespond,
    IDataRespond,
    MultipleRespond, SingleRespond
} from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { GetSortObjectResponseData } from '../sort-object/dto/get-sort-object.dto';
import { SORT_OBJECT_TYPE } from '../sort-object/sort-object.constant';
import { SortObjectService } from '../sort-object/sort-object.service';
import { ApiOperationInfo } from '../sort-object/sort-object.swagger';
import { DeleteTodoDTO, DeleteTodoSwagger } from './dtos/delete-sort-object.dto';
import { SortObjectTodoSwagger, UpdateSortObjectTodoDto } from './dtos/update-sort-object.dto';
import { IReq } from '../../common/interfaces';

@UseFilters(BadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@Controller(routestCtr.todoCtr.mainPath)
@ApiTags('Todo')
export class TodoController {
  constructor(
    private readonly sortObjectService: SortObjectService,
  ) {}

  @Get(routestCtr.todoCtr.orderPath)
  @ApiOperation(ApiOperationInfo.get)
  @ApiBadRequestResponse(SingleResponseCommonCode.RES_400)
  @ApiOkResponse({ type: GetSortObjectResponseData })
  @UseFilters(BadRequestValidationFilter)
  @UseFilters(UnknownExceptionFilter)
  async find(@Query(new GetAllValidationPipe({ entity: SortObject }))
   filter: GetAllFilterSortItem<SortObject>, @Req() req) {
    const dataRespond = await this.sortObjectService.getTodoOrders(filter, req as IReq);
    return dataRespond;
  }

  @Put(routestCtr.todoCtr.sortPath)
  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiBody({ type: SortObjectTodoSwagger })
  public async updateObjectOrderFn(
    @Body(new BatchValidationPipe({ items: UpdateSortObjectTodoDto, key: 'data' }))
    body: DataRespond,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const request_uid = uuidv4();
    const tododObjectOrder: ITodoObjectOrder = {
      data,
      object_type: OBJ_TYPE.VTODO,
    };

    const result = await this.sortObjectService
    .setTodoObjectOrder(tododObjectOrder, req.user, request_uid);
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
  @Put(routestCtr.todoCtr.resetOrderPath)
  @ApiOperation(ApiOperationInfo.reset)
  @ApiBadRequestResponse(SingleResponseCommonCode.RES_400)
  public async reset(@Req() req) {
    try {
      const rs = await this.sortObjectService.resetOrder(
        req.user.userId,
        SORT_OBJECT_TYPE.VTODO.toString(),
      );
      return new SingleRespond(rs).singleData();
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }
  }

  @UseInterceptors(HttpResponseCodeInterceptor)
  @UseFilters(BadRequestValidationFilter)
  @UseFilters(UnknownExceptionFilter)
  @ApiBody({ type: DeleteTodoSwagger })
  @ApiOperation({
    summary: 'Delete todo sort item',
  })
  @Post(`${routestCtr.todoCtr.deleteOrderPath}`)
  async deleteSort(
    @Body(new BatchValidationPipe({ items: DeleteTodoDTO, key: 'data' }))
      body: DeleteTodoSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.sortObjectService.deleteSortItems(data, req as IReq);
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
