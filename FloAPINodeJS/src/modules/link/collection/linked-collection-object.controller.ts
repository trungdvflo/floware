import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseInterceptors,
  UsePipes
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetLinkedPaging } from '../../../common/dtos/get-all-filter';
import { LinkedCollectionObject } from '../../../common/entities/linked-collection-object.entity';
import { HttpResponseCodeInterceptor } from '../../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../../common/pipes/validation.pipe';
import { deleteDescription, nameSwagger } from '../../../common/swaggers/link-collection-object.swagger';
import { IDataRespond, MultipleRespond } from '../../../common/utils/respond';
import { routestCtr } from '../../../configs/routes';
import {
  DeleteLinkedCollectionObjectDto,
  DeleteLinkedCollectionObjectSwagger
} from './dtos/delete-linked-collection-object.dto';
import { GetLinkedCollectionObjectResponse } from './dtos/get-linked-collection-object.dto';
import {
  LinkedCollectionObjectDto
} from './dtos/linked-collection-object.dto';
import {
  PostLinkedCollectionObjectDto,
  PostLinkedCollectionObjectResponse
} from './dtos/post-linked-collection-object.dto';
import { LinkedCollectionObjectService } from './linked-collection-object.service';
@ApiTags(nameSwagger)
@UseInterceptors(ClassSerializerInterceptor)
@Controller(routestCtr.linkedCollectionCtr.mainPath)
export class LinkedCollectionObjectController {
  constructor(private readonly service: LinkedCollectionObjectService) {}
  @Get()
  @ApiResponse({ status: 200, type: GetLinkedCollectionObjectResponse })
  public async index(
    @Req() req,
    @Query(new GetAllValidationPipe({ entity: LinkedCollectionObject }))
    filter: GetLinkedPaging<LinkedCollectionObject>,
  ): Promise<GetLinkedCollectionObjectResponse> {
    const { links, deletedItems } = await this.service.findAll(req.user, filter);
    return new GetLinkedCollectionObjectResponse(links, deletedItems, filter.has_del);
  }

  @Post()
  @UsePipes(new BatchValidationPipe({ items: LinkedCollectionObjectDto, key: 'data' }))
  @ApiResponse({ status: 200, type: PostLinkedCollectionObjectResponse })
  @UseInterceptors(HttpResponseCodeInterceptor)
  public async create(
    @Req() req,
    @Body()
    body: PostLinkedCollectionObjectDto,
  ) {
    const { data: links, errors: validationErrors } = body;
    const { created, errors: logicalErrors } = await this.service
      .createBatchLinks(links, req as IReq);
    const errors = [...validationErrors, ...logicalErrors];
    if (errors.length === 0)
      return {
        data: created,
      };
    return {
      data: created,
      error: { errors },
    };
  }

  @UseInterceptors(HttpResponseCodeInterceptor)
  @ApiOperation(deleteDescription)
  @ApiBody({ type: DeleteLinkedCollectionObjectSwagger })
  @Post(routestCtr.linkedCollectionCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: DeleteLinkedCollectionObjectDto, key: 'data' }))
    body: DeleteLinkedCollectionObjectSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.service.deleteBatchLinks(data, req as IReq);
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
