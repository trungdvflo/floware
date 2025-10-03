import {
  HttpStatus,
  Injectable,
  NestMiddleware,
  UnauthorizedException
} from '@nestjs/common';
import { validate } from 'class-validator';
import {
  MSG_APPREG_INVALID,
  MSG_TOKEN_EXPIRED,
  MSG_TOKEN_INVALID,
} from 'common/constants/message.constant';
import {
  AUTH_REDIS_CACHE_KEY,
  TYPE_TOKEN,
} from 'common/constants/oauth.constant';
import { IReqUser } from 'common/interfaces/auth.interface';
import { logRequest } from 'common/utils/common.util';
import { getUtcMillisecond } from 'common/utils/datetime.util';
import { HeaderAuthorizationDTO } from 'dto/header-authorization.dto';
import { Response } from 'express';
import { ErrorCode } from '../../common/constants/erros-dict.constant';
import { AuthService } from './auth.service';
@Injectable()
export class HeaderAuthorizationMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  // tslint:disable-next-line: ban-types
  async use(req: Request, res: Response, next: () => void) {
    try {
      // tslint:disable-next-line: new-parens
      const validateDTO: HeaderAuthorizationDTO = Object.assign(
        new HeaderAuthorizationDTO(),
        req.headers,
      );

      const errors = await validate(validateDTO);

      // keep show error message of Duc Doan
      if (errors.length > 0) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          error: {
            code: ErrorCode.UNAUTHORIZED_REQUEST,
            message: MSG_TOKEN_INVALID
          }
        });
        throw new UnauthorizedException(MSG_TOKEN_INVALID);
      }

      // check these keys are existed in redis or not
      const { authorization, app_id, device_uid } = validateDTO;
      const tokenValue = authorization.replace(TYPE_TOKEN, '');

      const cacheKey = `${AUTH_REDIS_CACHE_KEY}${tokenValue}`;
      const accessTokenInfo = await this.authService.getAuthCache(cacheKey);
      // keep show error message of Khoa Pham and Duc Doan
      if (!accessTokenInfo) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          error: {
            code: ErrorCode.UNAUTHORIZED_REQUEST,
            message: MSG_TOKEN_INVALID
          }
        });
        throw new UnauthorizedException(MSG_TOKEN_INVALID);
      }
      const millisecond = getUtcMillisecond();
      const ttl = Math.ceil((accessTokenInfo.expires_in - millisecond) / 1000);
      if (ttl <= 0) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          error: {
            code: ErrorCode.UNAUTHORIZED_REQUEST,
            message: MSG_TOKEN_EXPIRED
          }
        });
        throw new UnauthorizedException(MSG_TOKEN_EXPIRED);
      }
      if (
        accessTokenInfo.device_uid !== device_uid ||
        accessTokenInfo.app_id !== app_id
      ) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          error: {
            code: ErrorCode.UNAUTHORIZED_REQUEST,
            message: MSG_APPREG_INVALID
          }
        });
        throw new UnauthorizedException(MSG_APPREG_INVALID);
      }
      // case not migrate data user because missing user id from access token
      if (!accessTokenInfo.user_id) {
        res.status(HttpStatus.UNAUTHORIZED).json({
          error: {
            code: ErrorCode.UNAUTHORIZED_REQUEST,
            message: MSG_TOKEN_INVALID
          }
        });
        throw new UnauthorizedException(MSG_TOKEN_INVALID);
      }
      // case normal user 4.0
      req['user'] = {
        id: accessTokenInfo.user_id,
        userId: accessTokenInfo.user_id,
        email: accessTokenInfo.email,
        appId: accessTokenInfo.app_id,
        deviceUid: accessTokenInfo.device_uid,
        userAgent: req.headers['user_agent'] || accessTokenInfo.user_agent,
        token: tokenValue,
      } as IReqUser;
      logRequest(req);
      return next();
    } catch (e) {
      // keep show error code of Duc Doan
      if (e instanceof UnauthorizedException) {
        throw e;
      }
      throw new UnauthorizedException();
    }
  }
}
