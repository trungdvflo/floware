import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-streams-adapter';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';
import { LoggerService } from '../../common/logger/logger.service';

export class RedisIoStreamingAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  constructor(app: INestApplication) {
    super(app);
  }

  async connectToRedis(configService: ConfigService): Promise<void> {
    const url = `rediss://:${configService.get(
      'redisWsStreamAdapter.password'
    )}@${configService.get('redisWsStreamAdapter.host')}:${configService.get(
      'redisWsStreamAdapter.port'
    )}/${configService.get('redisWsStreamAdapter.db')}`;
    const clientRedis = createClient({ url });
    clientRedis.on('connect', () => {
      LoggerService.getInstance().logError('Connected to Redis...');
    });

    clientRedis.on('error', (e) => {
      throw new Error(`Redis connection failed: ${e}`);
    });

    this.adapterConstructor = createAdapter(clientRedis.connect(), {
      streamName: configService.get('WS_SERVER_KEY'),
    });
  }

  createIOServer(port: number, options?: ServerOptions): any {
    options.connectionStateRecovery = {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    };
    const server = super.createIOServer(port, { ...options, cors: true, cookie: true });

    server.adapter(this.adapterConstructor);
    return server;
  }
}
