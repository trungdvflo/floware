import { Controller, Get } from '@nestjs/common';
import { LoggerService } from '../common/logger/logger.service';
import { Persistence } from '../interface/message.interface';
import { MicroserviceProducerService } from './miccroservice-producer.service';

@Controller('test')
export class TestController {
  constructor(private readonly producerService: MicroserviceProducerService) {}

  @Get('send')
  async send() {
    const message = {
      from: 'thieulq1@flodev.net',
      event_type: 'NOTIFICATION',
      send_type: 'USER',
      message_code: 'tesst',
      send_offline: 0,
      metadata: { abc: 'aaa' },
      persistence: Persistence.PERSISTENCE,
      to: ['thieulq@flodev.net'],
      content: 'Test message from Thieu',
      delay: 0,
      qos: 0,
    };
    this.producerService.sendMsg(message).subscribe((data) => {
      LoggerService.getInstance().logInfo(data);
    });
    return true;
  }

  @Get('channel/create')
  async create_channel() {
    const message = {
      name: 'channel01',
      title: 'Test title',
      type: 'COLLECTION',
      internal_channel_id: 11111,
      members: ['thieulq@flodev.net'],
    };
    await this.producerService.sendCreateChannelMsg(message).toPromise();
    return true;
  }

  @Get('channel/member/create')
  async create_memeber_channel() {
    const message = {
      name: 'channel01',
      title: 'Test title',
      type: 'COLLECTION',
      internal_channel_id: 11111,
      members: ['thieulq@flodev.net'],
    };
    this.producerService
      .sendChannelAddMemberMsg(message)
      .subscribe((data) => LoggerService.getInstance().logInfo(data));
    return true;
  }

  @Get('channel/member/remove')
  async remove_memeber_channel() {
    const message = {
      name: 'channel01',
      title: 'Test title',
      type: 'COLLECTION',
      internal_channel_id: 11111,
      members: ['thieulq@flodev.net'],
    };
    this.producerService
      .sendChannelRemoveMemberMsg(message)
      .subscribe((data) => LoggerService.getInstance().logInfo(data));
    return true;
  }

  @Get('channel/remove')
  async delete_channel() {
    const message = 'channel01';
    this.producerService
      .sendRemoveChannelMsg(message)
      .subscribe((data) => LoggerService.getInstance().logInfo(data));
    return true;
  }

  @Get('chat/send')
  async send_chat_message() {
    const message = {
      from: { email: 'thieulq@flodev.net', app_id: 'xxxx', device_uid: 'xxxx' },
      content: 'this is chat message ',
      metadata: {
        event_timestamp: new Date().getTime() / 1000,
        attachments: [
          {
            name: 'test01.jpg',
            file_type: 'image/jpg',
            size: 10000,
            path: 'attachment/test01.jpg',
            thumb: 'attachment/test01.thumb.jpg',
          },
        ],
      },
      to: ['thieulq@flodev.net'],
    };
    return await this.producerService.sendChatMessage(message).toPromise();
  }
}
