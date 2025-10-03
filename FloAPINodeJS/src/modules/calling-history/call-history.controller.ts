import {
  Body,
  Controller,
  Get, Post, Query,
  Req,
  UseInterceptors
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { CallingHistory } from '../../common/entities/call-history.entity';
import {
  HttpResponseCodeInterceptor
} from '../../common/interceptors/http-response-code.interceptor';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { nameSwagger } from '../../common/swaggers/call-history.swagger';
import { IDataRespond, MultipleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { CallingHistoryService } from './call-history.service';
import { CreateVideoCallDTO, CreateVideoCallDTOSwagger } from './dtos/create-call-history.dto';
import { DeleteCallingHistoryDTO, DeleteCallingHistorySwagger } from './dtos/delete-call-history.dto';

@Controller(routestCtr.videoHistoryCtr.mainPath)
@ApiTags(nameSwagger)
export class CallingHistoryController {
  constructor(private readonly callhistoryService: CallingHistoryService) {}
  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: CallingHistory }))
    filter: GetAllFilter<CallingHistory>,
    @Req() req,
  ) {
    const dataRespond = await this.callhistoryService.getAllFiles(filter, req.user.userId);
    return dataRespond;
  }

  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiBody({ type: CreateVideoCallDTOSwagger })
  @Post()
  async createFn(
    @Body(new BatchValidationPipe({ items: CreateVideoCallDTO, key: 'data' }))
    body: CreateVideoCallDTOSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.callhistoryService.createItem(data, req.user.userId);
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
  @Post(routestCtr.videoHistoryCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: DeleteCallingHistoryDTO, key: 'data' }))
    body: DeleteCallingHistorySwagger, @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.callhistoryService.deleteMulItem(data, req.user.userId);
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
