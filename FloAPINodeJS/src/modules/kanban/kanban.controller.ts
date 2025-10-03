import {
  BadRequestException, Body, Controller,
  Get, Post, Put, Query, Req, UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBadRequestResponse, ApiBody, ApiOkResponse,
  ApiOperation,
  ApiTags
} from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { OBJ_TYPE } from '../../common/constants';
import { GetAllFilter4Collection } from '../../common/dtos/get-all-filter';
import { Kanban } from '../../common/entities/kanban.entity';
import { BadRequestValidationFilter, BaseBadRequestValidationFilter, UnknownExceptionFilter } from '../../common/filters/validation-exception.filters';
import {
  HttpResponseCodeInterceptor
} from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { IObjectOrder } from '../../common/interfaces/object-order.interface';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { SingleResponseCommonCode } from '../../common/swaggers/common.swagger';
import { CResetOrderInput } from '../../common/utils/common';
import { DataRespond, IDataRespond, MultipleRespond, SingleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { CustomSortObjectDto } from '../sort-object/dto/sort-object.dto';
import { SORT_OBJECT_TYPE } from '../sort-object/sort-object.constant';
import { SortObjectService } from '../sort-object/sort-object.service';
import { ApiOperationInfo } from '../sort-object/sort-object.swagger';
import { UpdateSortObjectNotTodoDto } from '../todo/dtos/update-sort-object.dto';
import { CreateKanbanBatchRequest } from './dto/create-kanban.request';
import { CreateKanbanResponse } from './dto/create-kanban.response';
import { DeleteKanbanBatchRequest } from './dto/delete-kanban.request';
import { DeleteKanbanResponse } from './dto/delete-kanban.response';
import { GetKanbanResponse } from './dto/get-kanban.response';
import { DeleteKanbanParam, KanbanParam, UpdateKanbanParam } from './dto/kanban-param';
import { KanbanResetDTO, KanbanResetItemDTO } from './dto/kanban.sort.dto';
import { UpdateKanbanBatchRequest } from './dto/update-kanban.request';
import { UpdateKanbanResponse } from './dto/update-kanban.response';
import { KanbanService } from './kanban.service';

@UseFilters(BadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@Controller(routestCtr.kanbanCtr.mainPath)

@ApiTags('kanbans')
export class KanbanController {
  constructor(
    private readonly kanbanService: KanbanService,
    private readonly sortObjectService: SortObjectService,
  ) { }

  @Get()
  @ApiOkResponse({
    description: 'The record has been successfully created.',
    type: GetKanbanResponse,
  })
  public async index(
    @Query(new GetAllValidationPipe({ entity: Kanban })) filter: GetAllFilter4Collection<Kanban>,
    @Req() req,
  ): Promise<GetKanbanResponse> {
    const { deletedItems, kanbans } = await this.kanbanService.findAll(req.user.userId, filter);

    return {
      data: kanbans,
      data_del: deletedItems,
    };
  }

  @Post()
  @UseInterceptors(HttpResponseCodeInterceptor)
  public async create(
    @Body() fullBody,
    @Body(new BatchValidationPipe({ items: KanbanParam, key: 'data' }))
    body: CreateKanbanBatchRequest,
    @Req() req,
  ): Promise<CreateKanbanResponse> {
    const { data, errors: validationErrors } = body;
    const { created, errors: logicalErrors } = await this.kanbanService.createBatchKanbans(
      data,
      fullBody.is_member, req
    );

    const errors = [...validationErrors, ...logicalErrors];
    if (errors.length === 0)
      return {
        data: created,
      };

    return {
      data: created,
      error: {
        errors,
      },
    };
  }

  @Put()
  @UseInterceptors(HttpResponseCodeInterceptor)
  public async update(
    @Body(
      new BatchValidationPipe({
        items: UpdateKanbanParam,
        key: 'data',
      }),
    )
    body: UpdateKanbanBatchRequest,
    @Req() req,
  ): Promise<UpdateKanbanResponse> {
    const { data, errors: validationErrors } = body;
    const {
      updated,
      errors: logicalErrors,
    } = await this.kanbanService.updateBatchKanbansWithReturn(data, req as IReq);

    const errors = [...validationErrors, ...logicalErrors];
    if (errors.length === 0)
      return {
        data: updated,
      } as UpdateKanbanResponse;
    return {
      data: updated,
      error: {
        errors,
      },
    };
  }

  @Post(routestCtr.kanbanCtr.deletePath)
  @UseInterceptors(HttpResponseCodeInterceptor)
  public async delete(
    @Body(new BatchValidationPipe({ items: DeleteKanbanParam, key: 'data' }))
    body: DeleteKanbanBatchRequest,
    @Req() req,
  ): Promise<DeleteKanbanResponse> {
    const { data, errors: validationErrors } = body;
    const { deleted, errors: logicalErrors } =
      await this.kanbanService.batchDelete(req.user.userId, data);
    const errors = [...validationErrors, ...logicalErrors];
    if (errors.length === 0)
      return {
        data: deleted,
      };
    return {
      data: deleted,
      error: {
        errors,
      },
    };
  }

  @Put(routestCtr.kanbanCtr.sortPath)
  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiBody({ type: UpdateSortObjectNotTodoDto })
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
    const kanbanObjectOrder: IObjectOrder = {
      data,
      object_type: OBJ_TYPE.KANBAN,
    };

    const result = await this.sortObjectService
      .setKanbanObjectOrder(kanbanObjectOrder, req.user, request_uid);
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
  @Put(routestCtr.kanbanCtr.resetOrderPath)
  @ApiOperation(ApiOperationInfo.reset)
  @ApiBadRequestResponse(SingleResponseCommonCode.RES_400)
  @ApiBody({ type: KanbanResetDTO })
  public async reset(@Body(new BatchValidationPipe(
    { items: KanbanResetItemDTO, key: 'data', allowEmptyArray: true }))
  body: CResetOrderInput, @Req() req) {
    try {
      const { data } = body;
      const rs = await this.sortObjectService.resetOrder(
        req.user.userId,
        SORT_OBJECT_TYPE.KANBAN.toString(),
        data
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
