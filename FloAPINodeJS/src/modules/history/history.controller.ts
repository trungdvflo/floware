import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { ContactHistory } from '../../common/entities/contact-history.entity';
import {
  BadRequestValidationFilter,
  UnknownExceptionFilter
} from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { IDataRespond, MultipleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { CreateHistoryDTO, CreateHistorySwagger } from './dtos/create-history.dto';
import { DeleteHistoryDTO, DeleteHistorySwagger } from './dtos/delete-history.dto';
import { ExtendValidationHelper } from './helpers/extend-validation.helper';
import { HistoryValidationPipe } from './history-validation.pipe';
import { HistoryService } from './history.service';

@UseFilters(BadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@UseInterceptors(HttpResponseCodeInterceptor)
@Controller(routestCtr.historyCtr.mainPath)
@ApiTags('Contact History')
export class HistoryController {
  constructor(private readonly historyService: HistoryService) { }
  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: ContactHistory }))
    filter: GetAllFilter<ContactHistory>,
    @Req() req,
  ) {
    const dataRespond = await this.historyService.getAllFiles(filter, req.user.userId);
    return dataRespond;
  }

  @ApiBody({ type: CreateHistorySwagger })
  @Post()
  async createFn(
    @Body(new HistoryValidationPipe({ items: CreateHistoryDTO, key: 'data' }))
    body: CreateHistorySwagger,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    // validate by logic of history such as destination_object_uid...
    const passData = [];
    await Promise.all(
      data.map(async (item) => {
        const rs: any = await ExtendValidationHelper.validateTypeObj(item);
        if (rs.isValid) {
          delete (item as any).is_specific_case;
          passData.push(item);
        } else {
          errors.push(rs.data);
        }
      })
    );
    const { itemPass, itemFail } = await this.historyService
      .createHistory(passData, req as IReq);
    errors.push(...itemFail);
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;
    return new MultipleRespond(dataRespond).multipleRespond();
  }

  @ApiBody({ type: DeleteHistorySwagger })
  @Post(routestCtr.historyCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: DeleteHistoryDTO, key: 'data' }))
    body: DeleteHistorySwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.historyService.deleteHistory(data, req as IReq);
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
