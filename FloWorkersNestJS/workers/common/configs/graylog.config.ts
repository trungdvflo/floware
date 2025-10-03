import { registerAs } from '@nestjs/config';

export default registerAs('graylog', () => ({
  hostName: process.env.GRAYLOG_HOST_NAME || 'FloWorker',
  hostServer: process.env.GRAYLOG_HOST || 'graylog.flodev.net',
  port: +process.env.GRAYLOG_PORT || 12210,
  facility: process.env.GRAYLOG_FACILITY || 'Queue_Workers4.2',
  bufferSize: +process.env.GRAYLOG_BUFFERSIZE || 50000,
  filterEnable: process.env.NODE_ENV_FILTER_ENABLE
    ? process.env.NODE_ENV_FILTER_ENABLE.toLocaleLowerCase() === 'true'
    : false
}));