import { Body, Controller, Get, Put, Query, Req, UseInterceptors } from '@nestjs/common';
import {
  ApiBody, ApiTags
} from '@nestjs/swagger';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { Collection } from '../../common/entities/collection.entity';
import { ResponseMappingInterceptor } from '../../common/interceptors';
import {
  HttpResponseCodeInterceptor
} from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { nameSwagger } from '../../common/swaggers/collection-member.swagger';
import { ResponseMutiData } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { CollectionMemberService } from './collection-member.service';
import { LeaveShareDTO, LeaveShareSwagger } from './dto/leave-share.dto';
@UseInterceptors(ResponseMappingInterceptor)
@ApiTags(nameSwagger)
@Controller(routestCtr.collectionMemberCtr.mainPath)
export class CollectionMemberController {
  constructor(private readonly collectionMemberService: CollectionMemberService) {}

  @Get()
  async index(
    @Query(new GetAllValidationPipe({ entity: Collection }))
    filter: GetAllFilter<Collection>,
    @Req() req,
  ) {
    const dataRespond = await this.collectionMemberService.getAllFiles(filter, req as IReq);
    return dataRespond;
  }

  @ApiBody({ type: LeaveShareSwagger })
  @Put(routestCtr.collectionMemberCtr.leaveShare)
  @UseInterceptors(HttpResponseCodeInterceptor)
  async UnShare(
    @Body(new BatchValidationPipe({ items: LeaveShareDTO, key: 'data' }))
    body: LeaveShareSwagger,
    @Req() req,
  ) {
    const { data, errors } = body;

    const result = await this.collectionMemberService.leaveShareMember(data, req as IReq);
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }

    return new ResponseMutiData(itemPass, errors);
  }
}
