import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UsePipes,
} from '@nestjs/common';
import { routestCtr } from '../configs/routes.config';
import { CommonValidationPipe } from '../utils/common.util';
import {
  ChannelItemParam,
  ChannelMemberItemParam,
  ChannelMemberParam,
  CreateChannelParam,
  QuerySearch,
  UpdateChannelMemberParam,
} from './channel-param.request';
import { ChannelService } from './channel.service';

@UsePipes(new CommonValidationPipe({ transform: true }))
@Controller(routestCtr.channelCtr.main)
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}
  @Post()
  async addChannel(@Body() body: CreateChannelParam) {
    return this.channelService.createChannel(body);
  }

  @Get()
  getChannel(@Query() query: QuerySearch, @Req() req): Promise<object> {
    return this.channelService.getChannel(req?.user.email, query);
  }

  @Get(routestCtr.channelCtr.member)
  getListChannelMember(@Param() data: ChannelItemParam, @Req() req): Promise<object> {
    return this.channelService.getChannelMember(data.channelName);
  }

  @Post(routestCtr.channelCtr.member)
  async addChannelMember(@Body() body: ChannelMemberParam, @Param() params: ChannelItemParam) {
    return this.channelService.addChannelMember(body.members, params.channelName);
  }

  @Put(routestCtr.channelCtr.member)
  async updateChannelMember(
    @Body() body: UpdateChannelMemberParam,
    @Param() params: ChannelItemParam
  ) {
    return this.channelService.revokeChannelMember(body.revoke_members, params.channelName);
  }

  @Delete(routestCtr.channelCtr.member)
  async deleteChannelMembers(@Body() body: ChannelMemberParam, @Param() params: ChannelItemParam) {
    return this.channelService.deleteChannelMember(body.members, params.channelName);
  }

  @Delete(routestCtr.channelCtr.memberItem)
  deleteChannelMember(@Param() data: ChannelMemberItemParam, @Req() req): Promise<object> {
    return this.channelService.deleteMemberByChannelName(data.email, data.channelName);
  }

  @Delete(routestCtr.channelCtr.item)
  async deleteChannel(@Param() params: ChannelItemParam) {
    return this.channelService.deleteChannel(params.channelName);
  }
}
