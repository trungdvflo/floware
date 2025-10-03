import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { WS_ADAPTER } from '../../common/constants';
import { RedisIoStreamingAdapter } from './websocket-redis-streaming.adapter';
import { RedisIoAdapter } from './websocket-redis.adapter';

export class WebsocketAdapterFactory {
  static async createAdapter(
    app: INestApplication,
    configService: ConfigService
  ): Promise<IoAdapter | null> {
    const adapter = configService.get('ws_adapter');
    let redisAdapter;
    switch (adapter) {
      case WS_ADAPTER.REDIS_ADAPTER:
        redisAdapter = new RedisIoAdapter(app);
        await redisAdapter.connectToRedis(configService);
        return redisAdapter;
      case WS_ADAPTER.REDIS_STREAMS_ADAPTER:
        redisAdapter = new RedisIoStreamingAdapter(app);
        await redisAdapter.connectToRedis(configService);
        return redisAdapter;
      default:
        redisAdapter = new RedisIoAdapter(app);
        await redisAdapter.connectToRedis(configService);
        return redisAdapter;
    }
  }
}
