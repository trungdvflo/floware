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
  ApiBadRequestResponse, ApiBody, ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { OBJ_TYPE } from '../../common/constants';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { KanbanCard } from '../../common/entities/kanban-card.entity';
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
import { DeleteKanbanCardBatchRequest } from './dto/delete-kanban-card.request';
import { DeleteKanbanCardResponse } from './dto/delete-kanban-card.response';
import { GetKanbanCardResponse } from './dto/get-kanban-card.response';
import { CreatekanbanCardSwagger, DeleteKanbanCardParam, KanbanCardParam } from './dto/kanban-card-param';
import { KanbanCardResetDTO, KanbanCardResetItemDTO } from './dto/kanban-card.sort.dto';
import { KanbanCardService } from './kanban-card.service';
@UseFilters(BadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@Controller(routestCtr.kanbanCardCtr.mainPath)
@ApiTags('kanban-cards')
export class KanbanCardController {
  constructor(
    private readonly kanbanCardService: KanbanCardService,
    private readonly sortObjectService: SortObjectService,
  ) { }

  @Get()
  @ApiOkResponse({
    description: 'The record has been successfully created.',
    type: GetKanbanCardResponse,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized',
  })
  public async index(
    @Query(new GetAllValidationPipe({ entity: KanbanCard })) filter: GetAllFilter<KanbanCard>,
    @Req() req,
  ): Promise<GetKanbanCardResponse> {
    const { deletedItems, kanbanCards } =
      await this.kanbanCardService.findAll(req.user.userId, filter);

    return {
      data: kanbanCards,
      data_del: deletedItems,
    };
  }

  @Post()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async createFn(
    @Body(new BatchValidationPipe({ items: KanbanCardParam, key: 'data' }))
    body: CreatekanbanCardSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.kanbanCardService.createKanbanCard(data, req as IReq);
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

  @Post(routestCtr.kanbanCardCtr.deletePath)
  @UseInterceptors(HttpResponseCodeInterceptor)
  public async delete(
    @Body(new BatchValidationPipe({ items: DeleteKanbanCardParam, key: 'data' }))
    body: DeleteKanbanCardBatchRequest,
    @Req() req,
  ): Promise<DeleteKanbanCardResponse> {
    const { data, errors: validatedErrors } = body;
    const { deleted, errors: logicalErrors } = await this.kanbanCardService.batchDeleteKanbanCards(
      data, req
    );

    const errors = [...validatedErrors, ...logicalErrors];
    if (errors.length === 0) {
      return {
        data: deleted,
      };
    }

    return {
      data: deleted,
      error: {
        errors,
      },
    };
  }

  @Put(routestCtr.kanbanCardCtr.sortPath)
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
    const kanbanCardObjectOrder: IObjectOrder = {
      data,
      object_type: OBJ_TYPE.CANVAS,
    };

    const result = await this.sortObjectService
      .setKanbanCardObjectOrder(kanbanCardObjectOrder, req.user, request_uid);
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
  @Put(routestCtr.kanbanCardCtr.resetOrderPath)
  @ApiOperation(ApiOperationInfo.reset)
  @ApiBadRequestResponse(SingleResponseCommonCode.RES_400)
  @ApiBody({ type: KanbanCardResetDTO })
  public async reset(@Body(new BatchValidationPipe(
    { items: KanbanCardResetItemDTO, key: 'data', allowEmptyArray: true }))
  body: CResetOrderInput, @Req() req) {
    try {
      const { data } = body;
      const rs = await this.sortObjectService.resetOrder(
        req.user.userId,
        SORT_OBJECT_TYPE.CANVAS.toString(),
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
