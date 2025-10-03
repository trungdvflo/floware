import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';
import { redisClientCluster } from './redis-client.factory';
import { RedisCacheRepository } from './repository/redis-cache.repository';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [redisClientCluster, RedisCacheRepository],
  exports: [RedisCacheRepository],
})
export class RedisModule {}
