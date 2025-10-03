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
import { GetAllFilter } from '../../../common/dtos/get-all-filter';
import { LinkedCollectionObject } from '../../../common/entities/linked-collection-object.entity';
import { HttpResponseCodeInterceptor } from '../../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../../common/pipes/validation.pipe';
import { deleteDescription, nameSwagger } from '../../../common/swaggers/link-collection-object-member.swagger';
import { IDataRespond, MultipleRespond } from '../../../common/utils/respond';
import { routestCtr } from '../../../configs/routes';
import {
  DeleteLinkedCollectionObjectMemberDto,
  DeleteLinkedCollectionObjectMemberSwagger
} from './dtos/delete-linked-collection-object-member.dto';
import { GetLinkedCollectionObjectMemberResponse } from './dtos/get-linked-collection-object-member.dto';
import {
  LinkedCollectionObjectMemberDto
} from './dtos/linked-collection-object-member.dto';
import {
  PostLinkedCollectionObjectMemberDto,
  PostLinkedCollectionObjectMemberResponse
} from './dtos/post-linked-collection-object-member.dto';
import { LinkedCollectionObjectMemberService } from './linked-collection-object-member.service';
@ApiTags(nameSwagger)
@UseInterceptors(ClassSerializerInterceptor)
@Controller(routestCtr.linkedCollectionMemberCtr.mainPath)
export class LinkedCollectionObjectMemberController {
  constructor(private readonly service: LinkedCollectionObjectMemberService) { }
  @Get()
  @ApiResponse({ status: 200, type: GetLinkedCollectionObjectMemberResponse })
  public async index(
    @Req() req,
    @Query(new GetAllValidationPipe({ entity: LinkedCollectionObject }))
    filter: GetAllFilter<LinkedCollectionObject>,
  ): Promise<GetLinkedCollectionObjectMemberResponse> {
    const user = req.user;
    const { links, deletedItems } = await this.service.findAll(user, filter);
    return new GetLinkedCollectionObjectMemberResponse(links, deletedItems, filter.has_del);
  }

  @Post()
  @UsePipes(new BatchValidationPipe({ items: LinkedCollectionObjectMemberDto, key: 'data' }))
  @ApiResponse({ status: 200, type: PostLinkedCollectionObjectMemberResponse })
  @UseInterceptors(HttpResponseCodeInterceptor)
  public async create(
    @Req() req,
    @Body()
    body: PostLinkedCollectionObjectMemberDto,
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
  @ApiBody({ type: DeleteLinkedCollectionObjectMemberSwagger })
  @Post(routestCtr.linkedCollectionMemberCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: DeleteLinkedCollectionObjectMemberDto, key: 'data' }))
    body: DeleteLinkedCollectionObjectMemberSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.service
      .deleteBatchLinks(data, req as IReq);
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
