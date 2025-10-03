import { Injectable, Logger, NestMiddleware } from '@nestjs/common';

import { ApiAuthHeader } from '../interface/api-auth-header.interface';
import { AuthService } from './auth.service';

@Injectable()
export class HeaderAuthorizationMiddleware implements NestMiddleware {
  private readonly logger: Logger;
  constructor(private readonly authService: AuthService) {
    this.logger = new Logger(HeaderAuthorizationMiddleware.name);
  }

  async use(req: Request, res: Response, next: () => void) {
    try {
      const authHeaderInfo: ApiAuthHeader = Object.assign(new ApiAuthHeader(), req.headers);
      const { system_token } = authHeaderInfo;
      if (system_token) {
        req['user'] = await this.authService.verifySystemAccessToken(system_token);
        return next();
      }
      req['user'] = await this.authService.verify(authHeaderInfo);
      return next();
    } catch (e) {
      this.logger.error(e);
      throw e;
    }
  }
}
