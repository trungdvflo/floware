import {
  Body,
  Controller,
  Put,
  Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBody, ApiTags
} from '@nestjs/swagger';
import {
  BadRequestValidationFilter, UnknownExceptionFilter
} from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe } from '../../common/pipes/validation.pipe';
import { nameSwaggerNoti } from '../../common/swaggers/collection.swagger';
import {
  IDataRespond,
  MultipleRespond,
  ResponseMutiData
} from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { CollectionActivityService } from './collection-activity.service';
import {
  MoveCollectionActivityDTO, MoveCollectionActivitySwagger
} from './dtos/collection-activity.put.dto';
@UseFilters(BadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@Controller(routestCtr.colActivityCtr.mainPath)
@ApiTags(nameSwaggerNoti)
export class CollectionActivityController {
  constructor(
    private readonly service: CollectionActivityService,
  ) { }

  @ApiBody({ type: MoveCollectionActivitySwagger })
  @Put()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async MoveFn(
    @Body(new BatchValidationPipe({ items: MoveCollectionActivityDTO, key: 'data' }))
    body: MoveCollectionActivitySwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.service
      .moveActivity(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    return new ResponseMutiData(itemPass, errors);
  }
}
