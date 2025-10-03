import { Controller, Get, Req, UsePipes } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { routestCtr } from '../configs/routes.config';
import { CommonValidationPipe } from '../utils/common.util';
import { WebsocketGateway } from './websocket.gateway';

@UsePipes(new CommonValidationPipe({ transform: true }))
@Controller(routestCtr.wsCtr.main)
export class WebsocketController {
  constructor(private readonly authService: AuthService, private readonly ws: WebsocketGateway) {}

  @Get(routestCtr.wsCtr.online)
  async getUserOnline(@Req() req) {
    return await this.ws.getUsersOnlineFromCache([req.user.email]);
  }

  @Get(routestCtr.wsCtr.token)
  async getWsAccess(@Req() req) {
    const token = await this.authService.generateWsAccessToken(req.user);
    return { data: { token } };
  }
}
