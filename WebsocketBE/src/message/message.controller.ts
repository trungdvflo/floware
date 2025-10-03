import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Put,
  Query,
  Req,
  UsePipes,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { routestCtr } from '../configs/routes.config';
import { MessageCode, Type } from '../interface/message.interface';
import { IPagination } from '../interface/pagination.interface';
import { CommonValidationPipe } from '../utils/common.util';
import { MessageQuerySearch, MessageStatusBody } from './dto/message.params';
import { MessageParam } from './dto/message.post.dto';
import { MessageFactory } from './message.factory';
import { MessageService } from './message.service';

@UsePipes(new CommonValidationPipe({ transform: true }))
@Controller(routestCtr.messageCtr.main)
export class MessageController {
  constructor(
    private readonly messageService: MessageService,
    private readonly configService: ConfigService) {}
  @Post()
  async sendMessage(
    @Body()
    body: MessageParam,
    @Req() req
  ) {
    const message = MessageFactory.createFromApiParams(body, req?.user);
    const sizeContent = Buffer.byteLength(message.payload.content);
    let sizeMetadata = 0;
    if (message.payload?.metadata) {
      sizeMetadata = Buffer.byteLength(JSON.stringify(message.payload.metadata));
    }
    const MAX_SIZE_EVENT = this.configService.get('app.event_max_size');
    if (
      message.payload.message_code !== MessageCode.TEST_MESSAGE &&
      sizeContent + sizeMetadata > MAX_SIZE_EVENT
    ) {
      throw new BadRequestException('Message size too large !');
    }
    if (message.header.event_type === Type.CHAT) {
      throw new BadRequestException('This api interface not support send chat message !');
    }
    return await this.messageService.send(message);
  }

  @Get(routestCtr.messageCtr.notification)
  getNotificationMessage(@Query() query: MessageQuerySearch, @Req() req): Promise<object> {
    return this.messageService.getNotificationMessages(
      {
        status: query.status,
        type: Type.NOTIFICATION,
        channel: query.channel,
        email: req.user.email,
      },
      {
        limit: query?.page_size,
        page: query?.page_no,
      } as IPagination
    );
  }

  @Put(routestCtr.messageCtr.notificationStatus)
  updateStatus(@Body() body: MessageStatusBody, @Req() req): Promise<object> {
    const { status, message_uid } = body;
    return this.messageService.updateNotificationStatus(message_uid, status, req.user.email);
  }
}
