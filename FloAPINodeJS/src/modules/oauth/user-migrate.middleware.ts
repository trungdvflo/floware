import {
  Injectable, NestMiddleware,
  UnauthorizedException, UseFilters
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isEmail } from 'class-validator';
import { Response } from 'express';
import { Repository } from 'typeorm';
import { MSG_APPREG_INVALID } from '../../common/constants/message.constant';
import { TYPE_TOKEN } from '../../common/constants/oauth.constant';
import { AppRegister } from '../../common/entities/app-register.entity';
import { BadRequestValidationFilter } from '../../common/filters/validation-exception.filters';
import { OAuthService } from './oauth.service';

@Injectable()
@UseFilters(new BadRequestValidationFilter())
export class UserMigrateMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(AppRegister)
    private readonly appRegister: Repository<AppRegister>,
    private readonly oAuthService: OAuthService,
  ) { }

  // tslint:disable-next-line: ban-types
  async use(req: Request, res: Response, next: Function) {
    try {
      // tslint:disable-next-line: new-parens
      const authorization = (req as any).headers.authorization;
      const token = authorization.replace(TYPE_TOKEN, '');
      const decodedAccessToken = await this.oAuthService.decodeJwtToken(token);

      if (!decodedAccessToken) {
        // just throw local
        throw new Error('fail decode');
      }
      const email = decodedAccessToken.email;
      const isValidMail = isEmail(email);
      if (!isValidMail) {
        // just throw local
        throw new Error('invalid email');
      }
      req['user'] = {
        email
      };
      next();
    } catch (e) {
      throw new UnauthorizedException(
        {
          message: MSG_APPREG_INVALID
        }
      );
    }
  }
}