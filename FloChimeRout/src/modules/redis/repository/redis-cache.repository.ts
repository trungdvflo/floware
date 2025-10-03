import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
export const MEETING_COUNTER_PREFIX = 'meeting_attendee_counter';
@Injectable()
export class RedisCacheRepository implements OnModuleDestroy {
  private serverPrefix: string;
  constructor(
    @Inject('RedisClusterClient')
    private readonly redisClient: Redis,
    private readonly configService: ConfigService
  ) {
    this.serverPrefix = this.configService.get('app.name', 'chime_router');
  }

  onModuleDestroy(): void {
    this.redisClient.disconnect();
  }

  async sadd(prefix: string, name: string, values: string[]): Promise<number | null> {
    const setName = `${this.serverPrefix}:${prefix}:${name}`;
    return await this.redisClient.sadd(setName, values);
  }

  async srem(prefix: string, name: string, values: string[]): Promise<number | null> {
    const setName = `${this.serverPrefix}:${prefix}:${name}`;
    return await this.redisClient.srem(setName, values);
  }

  async smember(prefix: string, name: string): Promise<string[] | null> {
    const setName = `${this.serverPrefix}:${prefix}:${name}`;
    return await this.redisClient.smembers(setName);
  }

  async get(prefix: string, key: string): Promise<string | null> {
    const cacheKey = `${this.serverPrefix}:${prefix}:${key}`;
    return await this.redisClient.get(cacheKey);
  }

  async set(prefix: string, key: string, value: string): Promise<void> {
    await this.redisClient.set(`${this.serverPrefix}:${prefix}:${key}`, value);
  }

  async delete(prefix: string, key: string): Promise<void> {
    await this.redisClient.del(`${this.serverPrefix}:${prefix}:${key}`);
  }

  async setWithExpiry(prefix: string, key: string, value: string, expiry: number): Promise<void> {
    const cacheKey = `${this.serverPrefix}:${prefix}:${key}`;
    await this.redisClient.set(cacheKey, value, 'EX', expiry);
  }

  async getdel(key: string): Promise<string | null> {
    return await this.redisClient.getdel(key);
  }

  async getKeys(partern: string): Promise<string[] | null> {
    const fullPartern = `${this.serverPrefix}:${partern}`;
    return await this.redisClient.keys(fullPartern);
  }

  async incr(prefix: string, key: string): Promise<number | null> {
    const cacheKey = `${this.serverPrefix}:${prefix}:${key}`;
    return await this.redisClient.incr(cacheKey);
  }

  async decr(prefix: string, key: string): Promise<number | null> {
    const cacheKey = `${this.serverPrefix}:${prefix}:${key}`;
    return await this.redisClient.decr(cacheKey);
  }

}
