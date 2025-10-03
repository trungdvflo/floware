import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QueueName } from '../../common/constants';
import { InviteSilentPushDTO } from '../conference-invite/dtos';

export enum WebSocketJobNames {
  CALL_FLO_WEB_SOCKET = 'callFloWebSocket',
  REPLY_FLO_WEB_SOCKET = 'replyFloWebSocket'
}

@Injectable()
export class WebSocketQueueService {
  constructor(
    @InjectQueue(QueueName().WEB_SOCKET_QUEUE)
    private readonly webSocketQueue: Queue
  ) { }

  async floAppCallFloWebSocket(input: InviteSilentPushDTO) {
    try {
      const rs = await this.webSocketQueue
        .add(WebSocketJobNames.CALL_FLO_WEB_SOCKET, input);
      return 1;
    } catch {
      return 0;
    }
  }

  async floAppReplyFloWebSocket(input: InviteSilentPushDTO) {
    try {
      await this.webSocketQueue.add(WebSocketJobNames.REPLY_FLO_WEB_SOCKET, input);
      return 1;
    } catch {
      return 0;
    }
  }
}
