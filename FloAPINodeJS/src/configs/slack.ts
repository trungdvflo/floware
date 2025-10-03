import { registerAs } from '@nestjs/config';

export default registerAs('slack', () => ({
  token: process.env.SLACK_TOKEN,
  channel_report_error:  process.env.SLACK_CHANNEL_WEBSOCKET_REPORT_ERROR
}));