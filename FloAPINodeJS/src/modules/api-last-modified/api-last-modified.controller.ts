import {
  Body, Controller, Get, HttpCode, HttpStatus,
  Put, Query, Req, UseInterceptors, UsePipes
} from '@nestjs/common';
import {
  ApiBadRequestResponse, ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { MSG_TOKEN_INVALID } from '../../common/constants/message.constant';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { WebOnly } from '../../common/interceptors/web-only.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe } from '../../common/pipes/validation.pipe';
import { IDataRespond, MultipleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { ApiLastModifiedService } from './api-last-modified.service';
import { GetInfo } from './api-last-modified.swagger';
import {
  ApiLastModifiedResponse,
  GetApiLastModifiedDto,
  GetApiLastModifiedError,
  GetApiLastModifiedResponse
} from './dto/get-api-last-modified.dto';
import {
  PutApiLastModifiedDto, PutApiLastModifiedDtos, PutApiLastModifiedError, PutApiLastModifiedResponse
} from './dto/put-api-last-modified.dto';
import { ApiLastModifiedValidationPipe } from './pipes/api-last-modified-validation.pipe';

@ApiTags('Api Last Modified')
@UseInterceptors(HttpResponseCodeInterceptor)
@Controller(routestCtr.apiLastModifiedCtr.mainPath)
export class ApiLastModifiedController {
  constructor(private readonly apiLastModifiedService: ApiLastModifiedService) { }

  @Get()
  @ApiOperation({
    summary: GetInfo.summary,
    description: GetInfo.description,
  })
  @ApiUnauthorizedResponse({
    schema: {
      example: {
        message: MSG_TOKEN_INVALID,
      },
    },
  })
  @ApiBadRequestResponse({ type: GetApiLastModifiedError })
  @ApiResponse({ status: 200, type: GetApiLastModifiedResponse })
  @UsePipes(new ApiLastModifiedValidationPipe())
  async findAll(
    @Query() getApiLastModifiedDto: GetApiLastModifiedDto,
    @Req() req,
  ): Promise<GetApiLastModifiedResponse> {
    const results: ApiLastModifiedResponse[] = await this.apiLastModifiedService.findAll(
      getApiLastModifiedDto,
      req.user
    );
    return { data: results };
  }

  @Put()
  @ApiOperation({
    summary: GetInfo.summaryPut,
    description: GetInfo.description,
  })
  @ApiUnauthorizedResponse({
    schema: {
      example: {
        message: MSG_TOKEN_INVALID,
      },
    },
  })
  @HttpCode(HttpStatus.OK)
  @ApiBadRequestResponse({ type: PutApiLastModifiedError })
  @ApiResponse({ status: 200, type: PutApiLastModifiedResponse })
  @UseInterceptors(WebOnly)
  async update(
    @Body(new BatchValidationPipe({ items: PutApiLastModifiedDto, key: 'data' }))
    body: PutApiLastModifiedDtos,
    @Req() req,
  ): Promise<GetApiLastModifiedResponse> {
    const { data, errors } = body;

    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const { itemPass, itemFail } = await this.apiLastModifiedService
      .updateBatchModify(data, req as IReq);
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
