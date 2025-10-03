import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { ServerOptions } from 'socket.io';
import { LoggerService } from '../../common/logger/logger.service';
export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor: ReturnType<typeof createAdapter>;
  constructor(app: INestApplication) {
    super(app);
  }

  async connectToRedis(configService: ConfigService): Promise<void> {
    const url = `rediss://:${configService.get('redisWsAdapter.password')}@${configService.get(
      'redisWsAdapter.host'
    )}:${configService.get('redisWsAdapter.port')}/${configService.get('redisWsAdapter.db')}`;
    const pubClient = createClient({ url });
    pubClient.on('connect', () => {
      LoggerService.getInstance().logInfo('Connected to Redis...');
    });

    pubClient.on('error', (e) => {
      throw new Error(`Redis connection failed: ${e}`);
    });
    const subClient = pubClient.duplicate();
    await Promise.all([pubClient.connect(), subClient.connect()]);
    this.adapterConstructor = createAdapter(pubClient, subClient, {
      requestsTimeout: 10000,
      key: configService.get('WS_SERVER_KEY'),
    });
  }

  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, { ...options, cors: true });
    server.adapter(this.adapterConstructor);
    return server;
  }
}
