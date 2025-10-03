import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Headers,
  HttpException,
  HttpStatus, UseFilters, UseInterceptors
} from '@nestjs/common';
import {
  ApiTags
} from '@nestjs/swagger';
import { ErrorCode } from '../../common/constants/error-code';
import { MSG_APPREG_INVALID } from '../../common/constants/message.constant';
import { UnkownExceptionsFilter } from '../../common/filters/unkown-exceptions.filter';
import { routestCtr } from '../../configs/routes';
import { DynamicKeyService } from './dynamic-key.service';
@UseFilters(new UnkownExceptionsFilter())
@UseInterceptors(ClassSerializerInterceptor)
@ApiTags('Dynamic Key')
@Controller(routestCtr.dynamicKeyCtr.mainPath)
export class DynamicKeyController {
  constructor(private readonly fSrv: DynamicKeyService) {}

  @Get()
  async AesDecrypted(@Headers('app_id') appId, @Headers('device_uid') deviceUid): Promise<any> {
    try {
      const r = await this.fSrv.AesEncrypted(appId);
      if (r === null) {
        throw new Error(MSG_APPREG_INVALID);
      }
      return r;
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
          message: e.message,
          code: ErrorCode.DYNAMIC_KEY_BADKEY,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
