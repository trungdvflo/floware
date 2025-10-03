import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Put,
  Query,
  Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBody, ApiOkResponse,
  ApiOperation, ApiTags
} from '@nestjs/swagger';
import { Devicetoken } from '../../common/entities/devicetoken.entity';
import { BaseBadRequestValidationFilter } from '../../common/filters/validation-exception.filters';
import { HttpSingleResponseCodeInterceptor } from '../../common/interceptors/http-response-code-single-response.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe, SingleValidationPipe } from '../../common/pipes/validation.pipe';
import { SingleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { IReqUser } from '../oauth/oauth.middleware';
import { DevicetokenService } from './devicetoken.service';
import { CreateDeviceTokenDTOs } from './dtos/create-devicetoken.dto';
import { DeleteDevicetokenDTOs } from './dtos/delete-devicetoken.dto';
import { DeleteDevicetokenResponse } from './dtos/delete-devicetoken.response.dto';
import { GetDevicetokenDTO } from './dtos/get-devicetoken.request';
import { GetDevicetokenResponse } from './dtos/get-devicetoken.response';
import { SilentPushDTO, SilentPushDTOs } from './dtos/slient-push.dto';
import { UpdateDevicetokenDTOs } from './dtos/update-devicetoken.dto';

@UseFilters(BaseBadRequestValidationFilter)
@Controller(routestCtr.deviceTokenCtr.mainPath)
@ApiTags('Devicetoken')
@UseInterceptors(HttpSingleResponseCodeInterceptor)
export class DevicetokenController {
  constructor(private readonly service: DevicetokenService) { }

  @Get()
  @ApiOperation({
    summary: 'Get devicetokens',
  })
  @ApiOkResponse({ type: GetDevicetokenResponse })
  async findAll(
    @Req() req,
    @Query(new GetAllValidationPipe({ entity: Devicetoken }))
    filter: GetDevicetokenDTO,
  ) {
    return this.service.findAll(filter, req as IReq);
  }

  @Post()
  @ApiOperation({
    summary: 'Create devicetoken',
  })
  async create(
    @Body(new SingleValidationPipe({ items: CreateDeviceTokenDTOs, key: 'data' }))
    body: CreateDeviceTokenDTOs,
    @Req() req,
  ) {
    const user: IReqUser = req.user;
    const resData = await this.service.create(body.data, req as IReq);
    return new SingleRespond(resData).singleData();
  }

  @Put()
  @ApiOperation({
    summary: 'Update devicetoken',
  })
  async update(
    @Body(new SingleValidationPipe({ items: UpdateDevicetokenDTOs, key: 'data' }))
    body: UpdateDevicetokenDTOs,
    @Req() req,
  ) {
    const resData = await this.service.update(body.data, req as IReq);
    return new SingleRespond(resData).singleData();
  }

  @Post(routestCtr.deviceTokenCtr.deletePath)
  @ApiOperation({
    summary: 'Delete devicetoken',
  })
  @ApiOkResponse({ status: HttpStatus.OK, type: DeleteDevicetokenResponse })
  async remove(
    @Body(new SingleValidationPipe({ items: DeleteDevicetokenDTOs, key: 'data' }))
    body: DeleteDevicetokenDTOs,
    @Req() req,
  ): Promise<DeleteDevicetokenResponse> {
    const { removed, error } = await this.service.remove(body.data, req as IReq);
    return {
      data: removed,
      error,
    };
  }
  // Deprecated
  @ApiBody({ type: SilentPushDTOs })
  @Post(routestCtr.deviceTokenCtr.pushPath)
  async sendInvite(
    @Body(new BatchValidationPipe({ items: SilentPushDTO, key: 'data', typeObj: 0 }))
    body: SilentPushDTOs, @Req() req) {
    const rs = await this.service.sendCallEvent(body['data']);
    return new SingleRespond(rs).singleData();
  }
}
