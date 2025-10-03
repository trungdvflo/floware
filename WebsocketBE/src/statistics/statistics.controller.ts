import { Controller, Get, Req, UsePipes } from '@nestjs/common';
import { routestCtr } from '../configs/routes.config';
import { CommonValidationPipe } from '../utils/common.util';
import { StatisticsService } from './statistics.service';

@UsePipes(new CommonValidationPipe({ transform: true }))
@Controller(routestCtr.statisticCtr.main)
export class StatisticsController {
  constructor(private readonly userService: StatisticsService) {}

  @Get()
  getUserUsage(@Req() req): Promise<object> {
    return this.userService.getUsageForUser(req.user.email);
  }
}
