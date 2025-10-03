import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { MSG_APPREG_INVALID, MSG_TOKEN_EXPIRED, MSG_TOKEN_INVALID } from '../../common/constants/message.constant';
import { AUTH_REDIS_CACHE_KEY, TYPE_TOKEN } from '../../common/constants/oauth.constant';
import { logRequest } from '../../common/utils/common';
import { getUtcMillisecond } from '../../common/utils/date.util';
import { HeaderAuthorizationDTO } from './dto/header-authorization.dto';
import { OAuthService } from './oauth.service';

export interface IReqUser {
  id: number;
  userId: number;
  email: string;
  appId: string;
  deviceUid: string;
  userAgent?: string;
  token: string;
}

@Injectable()
export class HeaderAuthorizationMiddleware implements NestMiddleware {
  constructor(
    private readonly oAuthService: OAuthService,
  ) { }

  // tslint:disable-next-line: ban-types
  async use(req: Request, res: Response, next: Function) {
    try {
      let validateDTO: HeaderAuthorizationDTO = Object
        // tslint:disable-next-line: new-parens
        .assign(new HeaderAuthorizationDTO, req.headers);
      const cacheSwagger = req['cookies']['swagger-info'];

      if (!validateDTO.authorization || !validateDTO.app_id || !validateDTO.device_uid) {
        if (cacheSwagger) {
          validateDTO = cacheSwagger;
        } else {
          throw new UnauthorizedException({ message: MSG_TOKEN_INVALID });
        }
      }

      // check these keys are existed in redis or not
      const { authorization, app_id, device_uid } = validateDTO;
      const tokenValue = authorization.replace(TYPE_TOKEN, '');

      const cacheKey = `${AUTH_REDIS_CACHE_KEY}${tokenValue}`;
      const accessTokenInfo = await this.oAuthService.getAuthCache(cacheKey);
      // keep show error message of Khoa Pham and Duc Doan
      if (!accessTokenInfo) {
        throw new UnauthorizedException({ message: MSG_TOKEN_INVALID });
      }
      const millisecond = getUtcMillisecond();
      const ttl = Math.ceil((accessTokenInfo.expires_in - millisecond) / 1000);
      if (ttl <= 0) {
        throw new UnauthorizedException({ message: MSG_TOKEN_EXPIRED });
      }
      if (accessTokenInfo.device_uid !== device_uid || accessTokenInfo.app_id !== app_id) {
        throw new UnauthorizedException({ message: MSG_APPREG_INVALID });
      }
      // case not migrate data user because missing user id from access token
      if (!accessTokenInfo.user_id) {
        throw new UnauthorizedException({ message: MSG_TOKEN_INVALID });
      }
      // case normal user 4.0
      req['user'] = {
        id: accessTokenInfo.user_id,
        userId: accessTokenInfo.user_id,
        email: accessTokenInfo.email,
        appId: accessTokenInfo.app_id,
        deviceUid: accessTokenInfo.device_uid,
        userAgent: req.headers['user_agent'] || accessTokenInfo.user_agent,
        token: tokenValue
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