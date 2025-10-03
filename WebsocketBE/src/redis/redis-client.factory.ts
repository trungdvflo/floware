import { FactoryProvider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import { LoggerService } from '../common/logger/logger.service';

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
      throw new Error(`Redis Cluster connection failed: ${e}`);
    });

    return redisInstance;
  },
  inject: [ConfigService],
};

export const redisClientStadalone: FactoryProvider<Redis> = {
  provide: 'RedisStandaloneClient',
  useFactory: (configService: ConfigService) => {
    const redisInstance = new Redis({
      host: configService.get('redisStandalone.host'),
      port: configService.get('redisStandalone.port'),
      db: configService.get('redisStandalone.db'),
      password: configService.get('redisStandalone.password'),
      tls: configService.get('redisStandalone.tls'),
    });
    redisInstance.on('connect', () => {
      LoggerService.getInstance().logInfo('Connected to Redis stand success !!');
    });
    redisInstance.on('error', (e) => {
      throw new Error(`Redis Cluster connection failed: ${e}`);
    });

    return redisInstance;
  },
  inject: [ConfigService],
};
