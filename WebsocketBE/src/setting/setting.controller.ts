import { Body, Controller, Get, Param, Put, Req, UsePipes } from '@nestjs/common';
import { routestCtr } from '../configs/routes.config';
import { CommonValidationPipe } from '../utils/common.util';

import { ChannelItemParam, SettingItem } from './setting-param.request';
import { SettingService } from './setting.service';

@UsePipes(new CommonValidationPipe({ transform: true }))
@Controller(routestCtr.settingCtr.main)
export class SettingController {
  constructor(private readonly settingService: SettingService) {}
  @Get()
  getUserSetting(@Req() req): Promise<object> {
    return this.settingService.getUserSetting(req.user.email);
  }

  @Get(routestCtr.settingCtr.channel)
  getChannelSetting(@Param() params: ChannelItemParam, @Req() req): Promise<object> {
    return this.settingService.getChannelSetting(req.user.email, params.channelName);
  }

  @Put()
  async saveSetting(@Body() body: SettingItem,  @Req() req) {
    return this.settingService.updateSetting(body, req.user);
  }
}
