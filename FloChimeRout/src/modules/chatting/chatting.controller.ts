import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseInterceptors,
  UsePipes
} from '@nestjs/common';

import {
  BatchValidationPipe,
  SingleValidationPipe,
} from 'common/fliters/validation.pipe';

import { HttpResponseArrayCodeInterceptor, HttpResponseCodeInterceptor, HttpSingleResponseCodeInterceptor } from 'common/interceptors/http-response-code-single-response.interceptor.chatting';
import { IReqUser } from 'common/interfaces/auth.interface';
import { IDataRespond } from 'common/interfaces/respond.interface';
import { MultipleRespond } from 'common/utils/respond';
import { routestCtr } from 'configs/routes.config';
import { ChatingService } from './chatting.service';
import { GetChatingDTO, GetDetailChatingDTO } from './dtos/chating.get.dto';
import { MemberChannelDTOs } from './dtos/chatting-member.post.dto';
import {
  DeleteChannelDTO,
  DeleteChannelDTOs,
  RemoveMembersDTOs,
} from './dtos/chatting.delete.dto';
import {
  CreateChannelDTOs,
  MessageDTOs,
  WSSMemberDTO
} from './dtos/chatting.post.dto';

@UsePipes(new BatchValidationPipe())
@Controller(routestCtr.chatCtr.mainPath)
export class ChatingController {
  constructor(private readonly chatingService: ChatingService) {}

  @UseInterceptors(HttpResponseCodeInterceptor)
  @Get(routestCtr.chatCtr.channelPath)
  async ListChannels(@Query() data: GetChatingDTO, @Req() req) {
    return this.chatingService.getListChannels(data, req.user.userId);
  }

  @UseInterceptors(HttpResponseCodeInterceptor)
  @Get(routestCtr.chatCtr.getSocketPath)
  async getMessageSession(@Query() data: WSSMemberDTO, @Req() req) {
    return this.chatingService.generateWebsocketUrl(data, req.user.userId);
  }

  @UseInterceptors(HttpResponseCodeInterceptor)
  @Get(routestCtr.chatCtr.channelMessages)
  async ListChannelMessages(@Query() data: GetDetailChatingDTO, @Req() req) {
    return this.chatingService.getListChannelMessages(data, req.user.userId);
  }

  @UseInterceptors(HttpResponseCodeInterceptor)
  @Post(routestCtr.chatCtr.removeMembers)
  async handleRemoveMember(
    @Body(new SingleValidationPipe({ items: RemoveMembersDTOs, key: 'data' }))
    body: RemoveMembersDTOs,
    @Req() req,
  ) {
    const userInfor: IReqUser = req.user;
    const result = await this.chatingService.removeMember(body.data, userInfor);
    return result;
  }

  @UseInterceptors(HttpSingleResponseCodeInterceptor)
  @Post(routestCtr.chatCtr.messagePath)
  async sendMessage(
    @Body( new SingleValidationPipe({ items: MessageDTOs, key: 'data'}))
    body: MessageDTOs,
    @Req() req,
  ) {
    const userInfor: IReqUser = req.user;
    return this.chatingService.sendMessage(body.data, userInfor);
  }

  // @Post(routestCtr.chatCtr.filePath)
  // async sendFile(
  //   @Body(new BatchValidationPipe({ items: FileDTO, key: 'data', typeObj: 0 }))
  //   body: FileDTOs, @Req() req
  // ) {
  //   const userInfor: IReqUser = req.user;
  //   return this.chatingService.sendFileMessage(body.data, userInfor);
  // }

  @UseInterceptors(HttpSingleResponseCodeInterceptor)
  @Post()
  async createChannel(
    @Body(new SingleValidationPipe({ items: CreateChannelDTOs, key: 'data' }))
    body: CreateChannelDTOs,
    @Req() req,
  ) {
    const userInfor: IReqUser = req.user;
    const resData = await this.chatingService.createChannel(
      body.data,
      userInfor,
    );
    return resData;
  }

  @UseInterceptors(HttpSingleResponseCodeInterceptor)
  @Post(routestCtr.chatCtr.addMember)
  async createChatingWithMember(
    @Body(new SingleValidationPipe({ items: MemberChannelDTOs, key: 'data' }))
    body: MemberChannelDTOs, @Req() req) {
    const userInfor: IReqUser = req.user;
    return this.chatingService.addMemberChannel(body.data, userInfor);
  }

  @UseInterceptors(HttpResponseArrayCodeInterceptor)
  @Post(routestCtr.chatCtr.delete)
  async deleteChannel(
    @Body(new BatchValidationPipe({ items: DeleteChannelDTO, key: 'data' }))
    body: DeleteChannelDTOs,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.chatingService.deleteChannel(
      data,
      req.user.userId,
    );
    const { itemPass, itemFail } = result;
    if (itemFail.length > 0) {
      itemFail.forEach((item) => errors.push(item));
    }
    const dataRespond: IDataRespond = new Object();
    // Just respond fields have value
    if (itemPass.length > 0) dataRespond.data = itemPass;
    if (errors.length > 0) dataRespond.errors = errors;

    return new MultipleRespond(dataRespond).multipleRespond();
  }
}
