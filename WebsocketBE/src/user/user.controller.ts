import { Controller, Get, Query, Req, UsePipes } from '@nestjs/common';
import { routestCtr } from '../configs/routes.config';
import { UserOnlineQuerySearch } from '../interface/user.interface';
import { CommonValidationPipe } from '../utils/common.util';
import { UserService } from './user.service';

@UsePipes(new CommonValidationPipe({ transform: true }))
@Controller(routestCtr.userCtr.main)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get(routestCtr.userCtr.online)
  getUserOnline(@Query() query: UserOnlineQuerySearch, @Req() req): Promise<object> {
    return this.userService.getUserOnline(req.user.email, query?.channel);
  }
}
