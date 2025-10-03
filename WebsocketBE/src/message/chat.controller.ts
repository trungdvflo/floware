import {
  BadRequestException,
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
import { ConfigService } from '@nestjs/config';
import { ChannelItemParam } from '../channel/channel-param.request';
import { routestCtr } from '../configs/routes.config';
import { MessageFilter, Type } from '../interface/message.interface';
import { IPagination } from '../interface/pagination.interface';
import { CommonValidationPipe } from '../utils/common.util';
import { ChatMessageService } from './chat.message.service';
import {
  ChatMessageQuerySearch,
  MessageItemBody,
  MessageItemContentBody,
  MessageItemParam,
} from './dto/message.params';
import { ChatMessageParam } from './dto/message.post.dto';
import { MessageFactory } from './message.factory';

@UsePipes(new CommonValidationPipe({ transform: true }))
@Controller(routestCtr.chatCtr.main)
export class ChatController {
  constructor(
    private readonly chatMessageService: ChatMessageService,
    private readonly configService: ConfigService) { }
  @Post()
  async sendMessage(
    @Body()
    body: ChatMessageParam,
    @Req() req
  ) {
    const message = MessageFactory.createFromApiChat(body, req?.user);
    const sizeContent = Buffer.byteLength(message.payload?.content ?? '');
    let sizeMetadata = 0;
    if (message.payload?.metadata) {
      sizeMetadata = Buffer.byteLength(JSON.stringify(message.payload?.metadata));
    }
    const MAX_SIZE_CHAT = this.configService.get('app.chat_max_size');

    if (sizeContent + sizeMetadata > MAX_SIZE_CHAT) {
      throw new BadRequestException('Message size too large !');
    }
    return await this.chatMessageService.send(req?.user, message);
  }

  @Get(routestCtr.chatCtr.channelMessage)
  getChannelMessage(
    @Param() params: ChannelItemParam,
    @Query() query: ChatMessageQuerySearch,
    @Req() req
  ): Promise<object> {
    const { channelName } = params;
    return this.chatMessageService.getChatMessages(
      {
        channel: channelName,
        type: Type.CHAT,
        email: req.user.email,
        ...query,
      } as MessageFilter,
      {
        limit: query?.page_size,
        page: query?.page_no,
      } as IPagination
    );
  }

  @Get(routestCtr.chatCtr.channelAttachment)
  getListAttachments(@Param() params: ChannelItemParam, @Req() req): Promise<object> {
    const { channelName } = params;
    return this.chatMessageService.getAttachments(channelName, req.user.email);
  }

  @Put(routestCtr.chatCtr.messages)
  updateMessage(@Body() body: MessageItemContentBody, @Req() req): Promise<object> {
    return this.chatMessageService.updateMessage(body, req.user.email);
  }

  @Put(routestCtr.chatCtr.channelLastSeen)
  updateLastSeen(
    @Body() body: MessageItemBody,
    @Param() params: ChannelItemParam,
    @Req() req
  ): Promise<object> {
    const { channelName } = params;
    const { message_uid } = body;
    return this.chatMessageService.updateLastSeen(message_uid, channelName, req.user.email);
  }

  @Get(routestCtr.chatCtr.channelLastSeen)
  getLastSeen(@Param() params: ChannelItemParam, @Req() req): Promise<object> {
    const { channelName } = params;
    return this.chatMessageService.getLastSeen(channelName, req.user.email);
  }

  @Get(routestCtr.chatCtr.messageItem)
  getMessage(@Param() params: MessageItemParam, @Req() req): Promise<object> {
    const { messageUid } = params;
    return this.chatMessageService.getChatMessage(messageUid, req.user.email);
  }

  @Delete(routestCtr.chatCtr.messageItem)
  deleteMessage(@Param() params: MessageItemParam, @Req() req): Promise<object> {
    const { messageUid } = params;
    return this.chatMessageService.deleteMessage(messageUid, req.user.email);
  }
}
