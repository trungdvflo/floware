import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  name: process.env.APP_NAME,
  port: parseInt(process.env.APP_PORT, 10) || 1986,
  version: process.env.APP_VERSION,
  ws_secret: process.env.WS_SECRET_KEY,
  ws_server_key: process.env.WS_SERVER_KEY || 'WS_SERVER_KEY_DEFAULT',
  ws_expired_token: process.env.WS_TOKEN_EXPIRED_TIME,
  ws_expired_cache_messsag: +process.env.WS_CACHE_TIME_RECOVER_IN_SECONDS || 60,
  // support redis-adapter, redis-streams-adapter
  ws_adapter: process.env.WS_ADAPTER || 'redis-adapter',
  chat_max_size: +process.env.CHAT_MAX_SIZE || 4096, // 4KB
  event_max_size: +process.env.EVENT_MAX_SIZE || 2048, // 2KB
}));
