import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Req,
  Res,
  UseFilters,
  UseInterceptors,
  UsePipes
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { BaseBadRequestValidationFilter } from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { SingleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { GetCheckResetOrderStatusDto, GetCheckStatusDto } from './dto/get-sort-object.dto';
import { SortObjectCheckStatusValidationPipe } from './sort-object-validation.pipe';
import { BadRequestSortObjectError } from './sort-object.error';
import { SortObjectService } from './sort-object.service';

@ApiTags('​Object Orders')
@UseFilters(BaseBadRequestValidationFilter)
@Controller(routestCtr.objectOrderCtr.mainPath)
@UseInterceptors(HttpResponseCodeInterceptor)
export class SortObjectController {
  constructor(private readonly sortObjectService: SortObjectService) {}

  @UsePipes(new SortObjectCheckStatusValidationPipe(GetCheckStatusDto))
  @Get(routestCtr.objectOrderCtr.checkStatusPath)
  async check(@Query() getCheckStatusDto: GetCheckStatusDto, @Req() req, @Res() res: Response) {
    try {
      const result = await this.sortObjectService.checkStatus(
        getCheckStatusDto.request_uid,
        req.user.userId,
      );
      return res.json(new SingleRespond({ data: result }).singleData());
    } catch (error) {
      if (error instanceof BadRequestSortObjectError) {
        throw new BadRequestException(error);
      }
      throw error;
    }
  }

  @UsePipes(new SortObjectCheckStatusValidationPipe(GetCheckResetOrderStatusDto))
  @Get(routestCtr.objectOrderCtr.resetCheckStatusPath)
  async checkReset(
    @Query() getCheckStatusDto: GetCheckResetOrderStatusDto,
    @Req() req,
    @Res() res: Response,
  ) {
    try {
      const result = await this.sortObjectService.getResetOrderStatus(
        req.user.userId,
        getCheckStatusDto.sort_obj_type,
        getCheckStatusDto.request_uid,
      );
      return res.json(new SingleRespond({ data: result }).singleData());
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw error;
    }
  }

  // @Get()
  // @ApiOperation(ApiOperationInfo.get)
  // @ApiUnauthorizedResponse(ResponseSchema.un_authorized)
  // @ApiBadRequestResponse({ type: BadRequestSortObjectError })
  // @ApiOkResponse({ type: GetSortObjectResponse })
  // @UsePipes(new ValidationPipe({ transform: true }))
  // @Authorization(true)
  // async find(@Query() getSortObjectDto: GetSortObjectDto, @Req() req, @Res() res: Response) {
  //   try {
  //     const result = await this.sortObjectService
  //       .getObjectOrders(getSortObjectDto, req.user.userId);
  //     res.set('X-Total-Count', result.total.toString());
  //     delete result.total;
  //     res.json(result);
  //   } catch (error) {
  //     if (error instanceof BadRequestSortObjectError) {
  //       throw new BadRequestException(error);
  //     }
  //     throw error;
  //   }
  // }
  //
  // @Put()
  // @ApiOperation(ApiOperationInfo.put)
  // @ApiUnauthorizedResponse(ResponseSchema.un_authorized)
  // @ApiBadRequestResponse({ type: BadRequestSortObjectError })
  // @Authorization(true)
  // @UsePipes(new SortObjectValidationPipe())
  // @UseFilters(BaseBadRequestValidationFilter)
  // public async update(
  //   @Body()
  //   body: UpdateSortObjectDto,
  //   @Req() req,
  // ) {
  //   try {
  //     const result = await this.sortObjectService.
  //     setObjectOrder(body, req.user.userId, req.user.email);
  //     return new MultipleRespond(result).multipleRespond();
  //   } catch (error) {
  //     if (error instanceof BadRequestSortObjectError) {
  //       throw new BadRequestException(error);
  //     }
  //     throw error;
  //   }
  // }
}
