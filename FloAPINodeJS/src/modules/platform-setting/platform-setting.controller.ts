import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Put,
  Query,
  Req, UseFilters, UseInterceptors,
  UsePipes,
  ValidationPipe
} from '@nestjs/common';
import {
  ApiOkResponse,
  ApiQuery,
  ApiTags
} from '@nestjs/swagger';
import { ErrorCode } from '../../common/constants/error-code';
import {
  MSG_APPREG_TAKEN,
  MSG_FIND_NOT_FOUND
} from '../../common/constants/message.constant';
import { UnkownExceptionsFilter } from '../../common/filters/unkown-exceptions.filter';
import { HttpSingleResponseCodeInterceptor } from '../../common/interceptors/http-response-code-single-response.interceptor';
import { IReq } from '../../common/interfaces';
import { getUpdateTimeByIndex, getUtcMillisecond } from '../../common/utils/date.util';
import { routestCtr } from '../../configs/routes';
import { PFSconst } from './constants.controller';
import { ParamPlatformSettingDto } from './dto/param-platform-setting.dto';
import { IPlatformSettingDto } from './dto/platform-setting.dto';
import {
  ReqCreateDto,
  ReqUpdateDto,
  RespDto
} from './dto/req.dto';
import { PlatformSettingService } from './platform-setting.service';

@ApiTags('Platform Setting')
@Controller(routestCtr.platFormSettingCtr.mainPath)
@UsePipes(new ValidationPipe({ transform: true }))
@UseInterceptors(ClassSerializerInterceptor)
@UseInterceptors(HttpSingleResponseCodeInterceptor)
@UseFilters(new UnkownExceptionsFilter())
export class PlatformSettingController {
  constructor(private readonly pfsSrv: PlatformSettingService) { }

  @Post()
  @ApiOkResponse({ status: HttpStatus.CREATED, type: RespDto })
  async create(@Body() reqDto: ReqCreateDto, @Req() req): Promise<RespDto> {
    reqDto.data.app_reg_id = req.user.appId;
    reqDto.data.user_id = req.user.userId;
    const ping = await this.pfsSrv.ping(reqDto.data);
    if (ping > 0) {
      throw new HttpException(
        {
          attributes: {
            app_version: reqDto.data.app_version,
          },
          message: `${MSG_APPREG_TAKEN}`,
          code: ErrorCode.PLATFORM_SETTING_TAKEN,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    // TODO: need refractor all this code
    const currentTime = getUtcMillisecond();
    const dateItem = getUpdateTimeByIndex(currentTime, 0);
    reqDto.data['created_date'] = dateItem;
    reqDto.data['updated_date'] = dateItem;
    const r: IPlatformSettingDto = await this.pfsSrv.create(reqDto.data, req as IReq);

    return new RespDto(r);
  }

  @Put()
  @ApiOkResponse({ type: RespDto })
  async update(@Body() reqDto: ReqUpdateDto, @Req() req): Promise<RespDto> {
    /**
     * Mockup auth
     */
    reqDto.data.app_reg_id = req.user.appId;
    reqDto.data.user_id = req.user.userId;
    const r = await this.pfsSrv.update(reqDto.data, req as IReq);
    if (!r) {
      throw new HttpException(
        {
          attributes: { id: reqDto.data.id },
          message: `${MSG_FIND_NOT_FOUND} ${reqDto.data.id}`,
          code: ErrorCode.PLATFORM_SETTING_NOT_FOUND,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return new RespDto(r);
  }

  @Get()
  @ApiOkResponse({
    schema: {
      example: {
        data: [
          {
            id: 50,
            data_setting: {
              allert: 1,
            },
            app_version: 'R9p0Z3S',
            created_date: 1629185749.605,
            updated_date: 1629185749.605,
          },
        ],
      },
    },
  })
  @ApiQuery(PFSconst.app_version)
  async findAll(@Query() q: ParamPlatformSettingDto, @Req() req): Promise<any> {
    q.user_id = req.user.userId;
    q.app_reg_id = req.user.appId;
    const r: IPlatformSettingDto[] = await this.pfsSrv.find(q);
    if (!r || r.length === 0) {
      delete q.user_id;
      delete q.app_reg_id;
      throw new HttpException(
        {
          attributes: q,
          message: `${MSG_FIND_NOT_FOUND} ${q.app_version}`,
          code: ErrorCode.PLATFORM_SETTING_NOT_FOUND,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return {
      data: r,
    };
  }
}
