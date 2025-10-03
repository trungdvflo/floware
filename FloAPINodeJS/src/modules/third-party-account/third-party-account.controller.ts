import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Put,
  Query,
  Req,
  UseFilters,
  UseInterceptors
} from '@nestjs/common';
import {
  ApiBadRequestResponse, ApiCreatedResponse, ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse
} from '@nestjs/swagger';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_ERR_INVALID, MSG_TOKEN_INVALID
} from '../../common/constants/message.constant';
import { GetAllFilter } from '../../common/dtos/get-all-filter';
import { ThirdPartyAccount } from '../../common/entities/third-party-account.entity';
import { ValidationException } from '../../common/exceptions/validation.exception';
import {
  BadRequestValidationFilter,
  UnknownExceptionFilter
} from '../../common/filters/validation-exception.filters';
import { HttpResponseCodeInterceptor } from '../../common/interceptors/http-response-code.interceptor';
import { IReq } from '../../common/interfaces';
import { BatchValidationPipe, GetAllValidationPipe } from '../../common/pipes/validation.pipe';
import { IDataRespond, MultipleRespond } from '../../common/utils/respond';
import { routestCtr } from '../../configs/routes';
import { ApiLastModifiedQueueService } from '../bullmq-queue/api-last-modified-queue.service';
import { CreateThirdPartyAccountDto } from './dto/create-third-party-account.dto';
import {
  Delete3rdAccount,
  ReqCreateThirdPartyAccountDto,
  ReqDeleteThirdPartyAccount,
  ReqUpdateThirdPartyAccountDto,
  RespThirdPartyAccountDto,
  THIRD_PARTY_ACCOUNT_SAMPLE
} from './dto/req.dto';
import { UpdateThirdPartyAccountDto } from './dto/update-third-party-account.dto';
import { ThirdPartyAccountService } from './third-party-account.service';
@ApiTags('Third Party Account')
@Controller(routestCtr.thirdPartyAccountCtr.mainPath)
@UseFilters(BadRequestValidationFilter)
@UseFilters(UnknownExceptionFilter)
@UseInterceptors(HttpResponseCodeInterceptor)
export class ThirdPartyAccountController {
  constructor(
    private readonly thirdPartyAccountService: ThirdPartyAccountService,
    private readonly apiLastModifiedQueueService: ApiLastModifiedQueueService
  ) { }

  @Get()
  @ApiOperation({
    summary: 'Get Third Party Account',
  })
  @ApiUnauthorizedResponse({
    schema: {
      example: {
        message: MSG_TOKEN_INVALID,
      },
    },
  })
  @ApiOkResponse({ type: RespThirdPartyAccountDto })
  @ApiBadRequestResponse({ type: ValidationException })
  index(
    @Req() req,
    @Query(new GetAllValidationPipe({ entity: ThirdPartyAccount }))
    filter: GetAllFilter<ThirdPartyAccount>,
  ) {
    return this.thirdPartyAccountService.findAll(req.user.userId, filter);
  }

  /**
   * Create new 3rd accounts
   * @param req
   * @param reqDto
   * @returns
   */
  @ApiUnauthorizedResponse({
    schema: {
      example: {
        message: MSG_TOKEN_INVALID,
      },
    },
  })
  @ApiCreatedResponse({ type: RespThirdPartyAccountDto })
  @ApiResponse({
    status: 207,
    schema: {
      example: {
        data: [
          {
            id: 1,
            ...THIRD_PARTY_ACCOUNT_SAMPLE,
          },
        ],
        error: {
          errors: [
            {
              message: "ER_DUP_ENTRY: Duplicate entry '75-aaa@mgial.com-1'",
              attributes: {
                user_income: 'aaa@mgial.com',
              },
              code: 'badRequest',
            },
          ],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    schema: {
      example: {
        error: {
          errors: [
            {
              code: 'validationFailed',
              message: 'Field port_caldav invalid',
              attributes: {
                port_caldav: '993e',
              },
            },
          ],
        },
      },
    },
  })
  @Post()
  async create(
    @Body(new BatchValidationPipe({ items: CreateThirdPartyAccountDto, key: 'data' }))
    body: ReqCreateThirdPartyAccountDto,
    @Req() req,
  ) {
    const user = req.user;
    const { data: accounts, errors: validationErrors } = body;
    try {
      const { rok, rer } = await this.thirdPartyAccountService.create(accounts, req as IReq);
      return new RespThirdPartyAccountDto(rok, [...validationErrors, ...rer]);
    } catch (e) {
      if (e.code) {
        throw new HttpException(
          {
            message: e.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        {
          message: MSG_ERR_INVALID,
          attributes: {
            user_id: user.userId,
          },
          code: ErrorCode.BAD_REQUEST,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Update 3rd accounts
   * @param req
   * @param reqDto
   * @returns
   */
  @ApiResponse({
    status: 207,
    schema: {
      example: {
        data: [
          {
            id: 1,
            ...THIRD_PARTY_ACCOUNT_SAMPLE,
          },
        ],
        error: {
          errors: [
            {
              message: "ER_DUP_ENTRY: Duplicate entry '75-aaa@mgial.com-1'",
              attributes: {
                user_income: 'aaa@mgial.com',
              },
              code: 'badRequest',
            },
          ],
        },
      },
    },
  })
  @ApiBadRequestResponse({
    schema: {
      example: {
        error: {
          errors: [
            {
              code: 'validationFailed',
              message: 'Field port_caldav invalid',
              attributes: {
                port_caldav: '993e',
              },
            },
          ],
        },
      },
    },
  })
  @Put()
  async update(
    @Body(new BatchValidationPipe({ items: UpdateThirdPartyAccountDto, key: 'data' }))
    body: ReqUpdateThirdPartyAccountDto,
    @Req() req,
  ) {
    const { data: accounts, errors: validationErrors } = body;
    try {
      const { rok, rer } = await this.thirdPartyAccountService.update(accounts, req as IReq);
      return new RespThirdPartyAccountDto(rok, [...validationErrors, ...rer]);
    } catch (e) {
      if (e.code) {
        throw new HttpException(
          {
            message: e.message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      const errors = [
        {
          code: ErrorCode.BAD_REQUEST,
          message: MSG_ERR_INVALID,
          attributes: {},
        },
      ];
      return new RespThirdPartyAccountDto([], errors);
    }
  }

  @Post(routestCtr.thirdPartyAccountCtr.deletePath)
  async delete(
    @Body(new BatchValidationPipe({ items: Delete3rdAccount, key: 'data' }))
    body: ReqDeleteThirdPartyAccount,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }
    const { itemPass, itemFail } = await this.thirdPartyAccountService
      .delete(data, req as IReq);
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
