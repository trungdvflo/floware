import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Req,
  UseInterceptors,
  UsePipes
} from '@nestjs/common';

import {
  BatchValidationPipe, SingleValidationPipe
} from 'common/fliters/validation.pipe';

import { HttpResponseArrayCodeInterceptor, HttpResponseCodeInterceptor, HttpSingleResponseCodeInterceptor } from 'common/interceptors/http-response-code-single-response.interceptor.chatting';
import { IDataRespond } from 'common/interfaces/respond.interface';
import { MultipleRespond } from 'common/utils/chatting.respond';
import { routestCtr } from 'configs/routes.config';
import { ChatingService } from './chatting-int.service';
import { GenMemberDTO, GenMemberDTOs } from './dtos/chatting-int--gen-member.post.dto';
import { MemberChannelDTO, MemberChannelDTOs } from './dtos/chatting-int-member.post.dto';
import { ListMessageIntDTO, MessageIntDTOs } from './dtos/chatting-int-message.post.dto';
import { EditMessageIntDTO, EditMessageIntDTOs } from './dtos/chatting-int-message.put.dto';
import { DeleteIntDTO, DeleteIntDTOs, DeleteMessageIntDTO, DeleteMessageIntDTOs } from './dtos/chatting-int.delete.dto';
import { CreateChannelDTO, CreateChannelDTOs } from './dtos/chatting-int.post.dto';

@UsePipes(new BatchValidationPipe())
@Controller(routestCtr.chatIntCtr.mainPath)
export class ChatingController {
  constructor(private readonly chatingIntService: ChatingService) {}

  @UseInterceptors(HttpResponseArrayCodeInterceptor)
  @Post(routestCtr.chatIntCtr.generateMember)
  async generateMembers(
    @Body(new BatchValidationPipe({ items: GenMemberDTO, key: 'data' }))
    body: GenMemberDTOs,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.chatingIntService.generateMembers(data);
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

  @UseInterceptors(HttpResponseArrayCodeInterceptor)
  @Post()
  async createChannel(
    @Body(new BatchValidationPipe({ items: CreateChannelDTO, key: 'data' }))
    body: CreateChannelDTOs,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.chatingIntService.createChannel(data, req.user);
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

  @UseInterceptors(HttpResponseArrayCodeInterceptor)
  @Post(routestCtr.chatIntCtr.addMember)
  async createMembers(
    @Body(new BatchValidationPipe({ items: MemberChannelDTO, key: 'data' }))
    body: MemberChannelDTOs,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.chatingIntService.createMembers(data, req.user);
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

  @UseInterceptors(HttpResponseArrayCodeInterceptor)
  @Post(routestCtr.chatIntCtr.removeMember)
  async removeMembers(
    @Body(new BatchValidationPipe({ items: MemberChannelDTO, key: 'data' }))
    body: MemberChannelDTOs,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.chatingIntService.removeMembers(data, req.user);
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

  @UseInterceptors(HttpResponseArrayCodeInterceptor)
  @Post(routestCtr.chatIntCtr.delete)
  async deleteChannel(
    @Body(new BatchValidationPipe({ items: DeleteIntDTO, key: 'data' }))
    body: DeleteIntDTOs,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.chatingIntService.deleteChannels(data, req.user);
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

  @UseInterceptors(HttpResponseCodeInterceptor)
  @Get(routestCtr.chatIntCtr.getSocketPath)
  async getMessageSession(@Req() req) {
    return this.chatingIntService.getChatInfoByUser(req.user.userId);
  }

  @UseInterceptors(HttpResponseCodeInterceptor)
  @Get(routestCtr.chatIntCtr.messagePath)
  async ListChannelMessages(@Query() data: ListMessageIntDTO, @Req() req) {
    return this.chatingIntService.getListMessagesChannel(data, req.user.userId);
  }

  @UseInterceptors(HttpSingleResponseCodeInterceptor)
  @Post(routestCtr.chatIntCtr.messagePath)
  async sendMessage(
    @Body( new SingleValidationPipe({ items: MessageIntDTOs, key: 'data'}))
    body: MessageIntDTOs,
    @Req() req,
  ) {
    return this.chatingIntService.sendMessage(body.data, req);
  }

  @UseInterceptors(HttpResponseArrayCodeInterceptor)
  @Put(routestCtr.chatIntCtr.messagePath)
  async updateMessage(
    @Body(new BatchValidationPipe({ items: EditMessageIntDTO, key: 'data' }))
    body: EditMessageIntDTOs,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.chatingIntService.editMessage(data, req.user);
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

  @UseInterceptors(HttpResponseArrayCodeInterceptor)
  @Post(routestCtr.chatIntCtr.messageDeletePath)
  async deleteMessageChannel(
    @Body(new BatchValidationPipe({ items: DeleteMessageIntDTO, key: 'data' }))
    body: DeleteMessageIntDTOs,
    @Req() req,
  ) {
    const { data, errors } = body;
    if (data.length === 0) {
      return new MultipleRespond({ errors } as IDataRespond).multipleRespond();
    }

    const result = await this.chatingIntService.handleDeleteMessage(data, req.user);
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