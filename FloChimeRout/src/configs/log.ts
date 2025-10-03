import { registerAs } from '@nestjs/config';
import { GRAYLOG } from 'common/constants/environment.constant';
export default registerAs('log', () => ({
  dsn: process.env.LOG_GRAYLOG_HOST || 'graylog.flodev.net',
  port: parseInt(process.env.LOG_GRAYLOG_PORT, 10) || 12201,
  facility: process.env.APP_NAME || 'FLO_CHIME',
  bufferSize: parseInt(process.env.LOG_GRAYLOG_BUFFERSIZE, 10) || GRAYLOG.BUFFERSIZE,
  filterEnable: process.env.NODE_ENV_FILTER_ENABLE
    ? process.env.NODE_ENV_FILTER_ENABLE.toLocaleLowerCase() === 'true'
    : false
}));
