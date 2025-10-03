import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from 'common/logger/logger.service';
import { Redis } from 'ioredis';

export const redisClientCluster: FactoryProvider<Redis> = {
  provide: 'RedisClusterClient',
  useFactory: (configService: ConfigService) => {
    const redisInstance = new Redis({
      host: configService.get('redisCluster.host'),
      port: configService.get('redisCluster.port'),
      db: configService.get('redisCluster.db'),
      password: configService.get('redisCluster.password'),
      tls: configService.get('redisCluster.tls'),
    });
    redisInstance.on('connect', () => {
      LoggerService.getInstance().logInfo('Connected to Redis Cluster success !!');
    });
    redisInstance.on('error', (e) => {
      LoggerService.getInstance().logError(`Redis Cluster connection failed: ${e}`);
      console.log(`Redis Cluster connection failed: ${e}`);
      // throw new Error(`Redis Cluster connection failed: ${e}`);
    });

    return redisInstance;
  },
  inject: [ConfigService],
};