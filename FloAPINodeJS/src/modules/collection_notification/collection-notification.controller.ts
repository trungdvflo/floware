import {
  Body,
  Controller, Get, HttpCode, HttpStatus, Post, Put, Query, Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBody, ApiOperation, ApiResponse, ApiTags
} from '@nestjs/swagger';
import { CollectionNotificationEntity } from '../../common/entities/collection-notification.entity';
import {
  BadRequestValidationFilter, UnknownExceptionFilter
} from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { nameSwaggerNoti } from '../../common/swaggers/collection.swagger';
import {
  IDataRespond,
  MultipleRespond,
  ResponseMutiData
} from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { CollectionNotificationService } from './collection-notification.service';
import {
  DeleteNotificationDto, DeleteNotificationDtos,
  GetAllFilterCollectionNotification,
  UpdateNotificationDto, UpdateNotificationDtos
} from './dtos';
import { DeleteNotificationResponse } from './notification.respone-sample.swagger';
@UseFilters(BadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@Controller(routestCtr.colNotiCtr.mainPath)
@UseInterceptors(HttpResponseCodeInterceptor)
@ApiTags(nameSwaggerNoti)
export class CollectionNotificationController {
  constructor(
    private readonly service: CollectionNotificationService,
  ) { }

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: CollectionNotificationEntity }))
    filter: GetAllFilterCollectionNotification<CollectionNotificationEntity>,
    @Req() req,
  ) {
    const dataRespond = await this.service
      .getNotifications(filter, req as IReq);
    return dataRespond;
  }

  @ApiBody({ type: UpdateNotificationDtos })
  @Put(routestCtr.colNotiCtr.statusPath)
  async updateNotificationStatus(
    @Body(new BatchValidationPipe({ items: UpdateNotificationDto, key: 'data' }))
    body: UpdateNotificationDtos,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const result = await this.service
      .updateNotificationStatus(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    return new ResponseMutiData(itemPass, errors);
  }

  @ApiOperation({
    summary: 'Remove notifications',
    description:
      'Remove list of notifications',
  })
  @Post(routestCtr.colNotiCtr.deletePath)
  @ApiResponse(DeleteNotificationResponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async deleteNotification(
    @Body(new BatchValidationPipe({ items: DeleteNotificationDto, key: 'data' }))
    body: DeleteNotificationDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const { itemPass, itemFail } = await this.service
      .deleteBatchNotification(data, req as IReq);
    if (itemFail && itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond();
  }
}
