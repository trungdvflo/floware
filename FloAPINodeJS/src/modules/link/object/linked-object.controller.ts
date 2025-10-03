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
import { LinkedObject } from '../../../common/entities/linked-object.entity';
import { HttpResponseCodeInterceptor } from '../../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../../common/pipes/validation.pipe';
import { IDataRespond, MultipleRespond } from '../../../common/utils/respond';
import { routestCtr } from '../../../configs/routes';
import { DeleteLinkedObjectDto, DeleteLinkedObjectSwagger } from './dtos/delete-linked-object.dto';
import { GetLinkedObjectResponse } from './dtos/get-linked-object.dto';
import { LinkedObjectDto } from './dtos/linked-object.dto';
import {
  PostLinkedObjectDto,
  PostLinkedObjectResponse
} from './dtos/post-linked-object.dto';
import { LinkedObjectService } from './linked-object.service';
@ApiTags('Linked Object')

@UseInterceptors(ClassSerializerInterceptor)
@Controller(routestCtr.linkedObjectCtr.mainPath)
export class LinkedObjectController {
  constructor(private readonly service: LinkedObjectService) { }
  @Get()
  @ApiResponse({ status: 200, type: GetLinkedObjectResponse })
  public async index(
    @Req() req,
    @Query(new GetAllValidationPipe({ entity: LinkedObject }))
    filter: GetLinkedPaging<LinkedObject>,
  ): Promise<GetLinkedObjectResponse> {
    const { links, deletedItems } = await this.service.findAll(filter, req as IReq);
    return new GetLinkedObjectResponse(links, deletedItems, filter.has_del);
  }

  @Post()
  @UsePipes(new BatchValidationPipe({ items: LinkedObjectDto, key: 'data' }))
  @ApiResponse({ status: 200, type: PostLinkedObjectResponse })
  @UseInterceptors(HttpResponseCodeInterceptor)
  public async create(
    @Req() req,
    @Body()
    body: PostLinkedObjectDto,
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
  @ApiOperation({
    summary: 'Delete list of Links Object',
    description: 'Delete list of Links Object',
  })
  @ApiBody({ type: DeleteLinkedObjectSwagger })
  @Post(routestCtr.linkedObjectCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: DeleteLinkedObjectDto, key: 'data' }))
    body: DeleteLinkedObjectSwagger,
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
