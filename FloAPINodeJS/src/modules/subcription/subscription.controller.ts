import {
  Body,
  Controller, Get, Post, Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import { ApiBody, ApiTags } from '@nestjs/swagger';
import { BaseBadRequestValidationFilter } from '../../common/filters/validation-exception.filters';
import { HttpSingleResponseCodeInterceptor } from '../../common/interceptors/http-response-code-single-response.interceptor';
import { IReq } from '../../common/interfaces';
import { SingleValidationPipe } from '../../common/pipes/validation.pipe';
import { nameSwagger } from '../../common/swaggers/system-collection.swagger';
import { SingleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { CreateSubcriptionSwagger } from './dtos/subcription.post.dto';
import { SubscriptionService } from './subscription.service';

@UseFilters(BaseBadRequestValidationFilter)
@UseInterceptors(HttpSingleResponseCodeInterceptor)
@Controller(routestCtr.subcriptioncollectionCtr.mainPath)
@ApiTags(nameSwagger)
export class SubscriptionController {
  constructor(
    private readonly subscriptionService: SubscriptionService,
  ) { }

  @Get()
  async index(@Req() req) {
    const dataRespond = await this.subscriptionService.getAllFiles(req);
    return dataRespond;
  }

  @ApiBody({ type: CreateSubcriptionSwagger })
  @Post()
  async create(
    @Body(new SingleValidationPipe({ items: CreateSubcriptionSwagger, key: 'data' }))
    body: CreateSubcriptionSwagger,
    @Req() req,
  ) {
    const resData = await this.subscriptionService.create(body.data, req as IReq);
    return new SingleRespond(resData).singleData();
  }
}
