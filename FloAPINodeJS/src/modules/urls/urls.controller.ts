import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  Query,
  Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBadRequestResponse, ApiBody, ApiOperation,
  ApiResponse,
  ApiTags
} from '@nestjs/swagger';
import { v4 as uuidv4 } from 'uuid';
import { OBJ_TYPE } from '../../common/constants';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { Url } from '../../common/entities/urls.entity';
import {
  BadRequestValidationFilter,
  BaseBadRequestValidationFilter
} from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { IObjectOrder } from '../../common/interfaces/object-order.interface';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import {
  SingleResponseCommonCode
} from '../../common/swaggers/common.swagger';
import {
  DataRespond,
  IDataRespond,
  MultipleRespond,
  ResponseMutiData, SingleRespond
} from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { CustomSortObjectDto } from '../sort-object/dto/sort-object.dto';
import { SORT_OBJECT_TYPE } from '../sort-object/sort-object.constant';
import { SortObjectService } from '../sort-object/sort-object.service';
import { ApiOperationInfo } from '../sort-object/sort-object.swagger';
import { UpdateSortObjectNotTodoDto } from '../todo/dtos/update-sort-object.dto';
import { UrlsCreateDto, UrlsCreateDtos } from './dtos/urls.create.dto';
import { UrlDeleteDto, UrlDeleteDtos } from './dtos/urls.delete.dto';
import {
  UrlCreateReponse,
  UrlDeleteReponse, UrlUpdateReponse
} from './dtos/urls.respone-sample.swagger';
import { UrlsUpdateDto, UrlsUpdateDtos } from './dtos/urls.update.dto';
import { UrlsService } from './urls.service';

@ApiTags('URL Bookmark')
@UseFilters(BadRequestValidationFilter)
@Controller(routestCtr.urlCtr.mainPath)
export class UrlsController {
  constructor(
    private readonly sortObjectService: SortObjectService,
    private readonly urlService: UrlsService,
  ) {}

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: Url }))
    filter: GetAllFilter<Url>,
    @Req() req,
  ) {
    const dataRespond = await this.urlService.getAllFiles(filter, req as IReq);
    return dataRespond;
  }

  @Post()
  @ApiOperation({
    summary: 'Create list of URLs Bookmark',
    description: 'Create Urls records with data sent from client',
  })
  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiResponse(UrlCreateReponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async create(
    @Body(new BatchValidationPipe({ items: UrlsCreateDto, key: 'data' }))
    body: UrlsCreateDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    const res = await this.urlService.saveBatch(data, errors, req as IReq);

    return new ResponseMutiData(res.results, res.errors);
  }

  @Put()
  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiOperation({
    summary: 'Update list of URLs Bookmark',
    description: 'Update Urls records with id and data sent from client',
  })
  @ApiResponse(UrlUpdateReponse.RES_200)
  async update(
    @Body(new BatchValidationPipe({ items: UrlsUpdateDto, key: 'data' }))
    body: UrlsUpdateDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    const res = await this.urlService.updateBatch(data, errors, req as IReq);

    return new ResponseMutiData(res.results, res.errors);
  }

  @Post(routestCtr.urlCtr.deletePath)
  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiOperation({
    summary: 'Delete list of URLs Bookmark',
    description: 'Delete list of URLs Bookmark',
  })
  @ApiResponse(UrlDeleteReponse.RES_200)
  @HttpCode(HttpStatus.OK)
  async delete(
    @Body(new BatchValidationPipe({ items: UrlDeleteDto, key: 'data' }))
    body: UrlDeleteDtos,
    @Req() req,
  ) {
    const { data, errors } = body;
    const res = await this.urlService.deleteBatch(data, errors, req as IReq);

    return new ResponseMutiData(res.results, res.errors);
  }

  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiBody({ type: UpdateSortObjectNotTodoDto })
  @Put(routestCtr.urlCtr.sortPath)
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
    const urlObjectOrder: IObjectOrder = {
      data,
      object_type: OBJ_TYPE.URL,
    };

    const result = await this.sortObjectService
    .setUrlObjectOrder(urlObjectOrder, req.user, request_uid);

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

  // @Put(routestCtr.urlCtr.sortPath)
  // @UseInterceptors(HttpResponseCodeInterceptor)
  // @ApiOperation({
  //   summary: 'Change URL object orders list',
  //   description: 'Change URL object orders list',
  // })
  // @ApiBadRequestResponse({ type: BadRequestSortObjectError })
  // @UsePipes(
  //   new SortObjectValidationPipe({
  //     object_type: SORT_OBJECT_TYPE.URL.toString(),
  //     key: 'data',
  //     schema: SortObjectDto,
  //   }),
  // )
  // @UseFilters(BaseBadRequestValidationFilter)
  // public async sort(
  //   @Body()
  //   body: UrlSortObjectDto,
  //   @Req() req,
  // ) {
  //   try {
  //     const object: any = {
  //       data: body.data,
  //       object_type: SORT_OBJECT_TYPE.URL,
  //     };
  //     const { errors } = body as any;
  //     if (body.data.length === 0) {
  //       return new ResponseMutiSortReqData(null, [], errors);
  //     }
  //     const result = await this.sortObjectService.setObjectOrder(
  //       object,
  //       req.user.userId,
  //       req.user.email,
  //     );
  //     result.errors = [...errors, ...result.errors];
  //     return new ResponseMutiSortReqData(result.request_uid, result.data, result.errors);
  //   } catch (error) {
  //     if (error instanceof BadRequestSortObjectError) {
  //       throw new BadRequestException(error);
  //     }
  //     throw error;
  //   }
  // }

  @UseFilters(BaseBadRequestValidationFilter)
  @Put(routestCtr.urlCtr.resetOrderPath)
  @ApiOperation(ApiOperationInfo.reset)
  @ApiBadRequestResponse(SingleResponseCommonCode.RES_400)
  public async reset(@Req() req) {
    try {
      const rs = await this.sortObjectService.resetOrder(
        req.user.userId,
        SORT_OBJECT_TYPE.URL.toString(),
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
