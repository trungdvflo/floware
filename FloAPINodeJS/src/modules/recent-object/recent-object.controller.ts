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
import {
  ApiBody,
  ApiCreatedResponse, ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { MSG_TOKEN_INVALID } from '../../common/constants/message.constant';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { RecentObject } from '../../common/entities/recent-object.entity';
import { BadRequestValidationFilter, UnknownExceptionFilter } from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { ResponseMutiData } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { DeleteCloudSwagger } from '../cloud/dtos/delete-cloud.dto';
import { GetRecentObjectResponse } from './dto/get-recent-object.dto';
import { PostRecentObjectDto, PostRecentObjectResponse } from './dto/post-recent-object.dto';
import { RecentObjectDeleteDto, RecentObjectDeleteDtos } from './dto/recent-object.delete.dto';
import { RecentObjectDto } from './dto/recent-object.dto';
import { RecentObjectService } from './recent-object.service';

@ApiTags('Recent Objects')
@Controller(routestCtr.recentObjectCtr.mainPath)
@UseInterceptors(HttpResponseCodeInterceptor)
export class RecentObjectController {
  constructor(private readonly recentObjectService: RecentObjectService) { }

  @Post()
  @ApiOperation({
    summary: 'Create or update recent objects',
  })
  @ApiUnauthorizedResponse({
    schema: {
      example: {
        message: MSG_TOKEN_INVALID,
      },
    },
  })
  @ApiCreatedResponse({ type: PostRecentObjectResponse })
  async create(
    @Body(new BatchValidationPipe({ items: RecentObjectDto, key: 'data' }))
    createRecentObjectDto: PostRecentObjectDto,
    @Req() req,
  ) {
    let { errors } = createRecentObjectDto;
    let results = [];
    if (createRecentObjectDto.data.length > 0) {
      const response = await this.recentObjectService
        .create(createRecentObjectDto.data, req as IReq);
      if (response.errors && response.errors.length) {
        errors = [...errors, ...response.errors];
      }
      results = response.data;
    }
    return {
      data: results,
      error: errors.length ? { errors } : undefined,
    };
  }

  @Get()
  @UseFilters(BadRequestValidationFilter)
  @UseFilters(UnknownExceptionFilter)
  @ApiOperation({
    summary: 'Get list recent object',
  })
  @ApiUnauthorizedResponse({
    schema: {
      example: {
        message: MSG_TOKEN_INVALID,
      },
    },
  })
  @ApiOkResponse({ type: GetRecentObjectResponse })
  async find(
    @Query(new GetAllValidationPipe({ entity: RecentObject }))
    filter: GetAllFilter<RecentObject>,
    @Req() req,
  ): Promise<any> {
    const results = await this.recentObjectService.findAll(filter, req.user.userId);
    return results;
  }

  @ApiBody({ type: DeleteCloudSwagger })
  @ApiOperation({
    summary: 'Delete recent object',
  })
  @Post(routestCtr.recentObjectCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: RecentObjectDeleteDto, key: 'data' }))
    body: RecentObjectDeleteDtos,
    @Req() req,
  ) {
    const { data, errors } = body;

    const result = await this.recentObjectService.deleteRecentObjs(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMutiData(itemPass, errors);
  }
}
