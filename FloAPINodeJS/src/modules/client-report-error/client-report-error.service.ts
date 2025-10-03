import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LogLevel, WebClient } from '@slack/web-api';
import { ErrorCode } from '../../common/constants/error-code';
import { IReq } from '../../common/interfaces';
import { getPlatformByAppId } from '../../common/utils/common';
import { buildFailItemResponse } from '../../common/utils/respond';
import { ReportErrorParam } from './dto/websocket-error.dto';
@Injectable()
export class ClientReportErrorService {
  slackService: WebClient;
  constructor(
    private readonly configService: ConfigService
  ) {
    const token = this.configService.get('slack.token');
    this.slackService = new WebClient(token, {
      logLevel: process.env.NODE_ENV === 'development'
        ? LogLevel.DEBUG
        : LogLevel.INFO
    });
  }

  async sendReportErrorWebsocket(r: ReportErrorParam, { user, headers }: IReq) {
    try {
      const message = `*<!channel> An error websocket connection from client occurs*
    \`\`\`
    Environment: ${process.env.NODE_ENV.toUpperCase()}
    DeviceId: ${user.deviceUid}
    Platform: ${getPlatformByAppId(user.appId)}
    UserAgent: ${headers['user-agent']}
    Error Code: ${r.error_code}
    Error Message: ${r.error_message}
    Retries: ${r.retries}
    Time: ${new Date().toString()}
    \`\`\``;
      return await this.sendToSlack(message);
    } catch (err) {
      throw new BadRequestException(
        buildFailItemResponse(ErrorCode.BAD_REQUEST, err.message, r),
      );
    }
  }

  async sendToSlack(message: string) {
    try {
      const channel = this.configService.get('slack.channel_report_error');
      await this.slackService.chat.postMessage({
        text: message,
        channel
      });
      return true;
    } catch (err) {
      throw new BadRequestException(err.message);
    }
  }
}