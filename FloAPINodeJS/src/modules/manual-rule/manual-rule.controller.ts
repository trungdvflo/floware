import {
  Body,
  Controller, Get, Post, Put, Query, Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBody, ApiTags
} from '@nestjs/swagger';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { RuleEntity } from '../../common/entities/manual-rule.entity';
import { BadRequestValidationFilter, UnknownExceptionFilter } from '../../common/filters/validation-exception.filters';
import {
  HttpResponseCodeInterceptor
} from '../../common/interceptors/http-response-code.interceptor';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { nameSwagger } from '../../common/swaggers/manual-rule.swagger';
import { IDataRespond, MultipleRespond, ResponseMutiData } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { ExecuteManualRuleDTO, ExecuteManualRuleSwagger } from './dtos/execute-manual-rule.dto';
import { DeleteManualRuleDTO, DeleteManualRuleSwagger } from './dtos/manual-rule.delete.dto';
import { CreateManualRuleDTO, CreateManualRuleSwagger } from './dtos/manual-rule.post.dto';
import { UpdateManualRuleDTO, UpdateManualRuleSwagger } from './dtos/manual-rule.put.dto';
import { ManualRuleService } from './manual-rule.service';

@UseFilters(BadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@Controller(routestCtr.ManualRuleCtr.mainPath)
@ApiTags(nameSwagger)
export class ManualRuleController {
  constructor(
    private readonly manualRuleService: ManualRuleService,
  ) { }

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: RuleEntity }))
    filter: GetAllFilter<RuleEntity>,
    @Req() req,
  ) {
    const dataRespond = await this.manualRuleService.getAllFiles(
      filter,
      req.user.userId
    );
    return dataRespond;
  }

  @ApiBody({ type: CreateManualRuleSwagger })
  @Post()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async createFn(
    @Body(new BatchValidationPipe({ items: CreateManualRuleDTO, key: 'data' }))
    body: CreateManualRuleSwagger, @Req() req) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.manualRuleService.createManualRule(
      data, req
    );
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

  @ApiBody({ type: ExecuteManualRuleSwagger })
  @Post(routestCtr.ManualRuleCtr.executePath)
  @UseInterceptors(HttpResponseCodeInterceptor)
  async executeFn(
    @Body(new BatchValidationPipe({ items: ExecuteManualRuleDTO, key: 'data' }))
    body: ExecuteManualRuleSwagger) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new ResponseMutiData([], errors);
    }

    const result = await this.manualRuleService.executeManualRule(data);

    return new ResponseMutiData(result.itemPass, [...errors, ...result.itemFail]);
  }

  @ApiBody({ type: UpdateManualRuleSwagger })
  @Put()
  @UseInterceptors(HttpResponseCodeInterceptor)
  async UpdateFn(
    @Body(new BatchValidationPipe({ items: UpdateManualRuleDTO, key: 'data' }))
    body: UpdateManualRuleSwagger, @Req() req) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.manualRuleService.updateManualRule(
      data,
      req
    );
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
  @ApiBody({ type: DeleteManualRuleSwagger })
  @Post(routestCtr.ManualRuleCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: DeleteManualRuleDTO, key: 'data' }))
    body: DeleteManualRuleSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.manualRuleService.deleteManualRule(
      data,
      req
    );
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
