import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import {
  AUTH_REDIS_CACHE_KEY,
  AUTH_REDIS_TTL_OVERDUE,
} from '../../common/constants/oauth.constant';
import { getUtcMillisecond } from 'common/utils/datetime.util';
import { JwtService } from '@nestjs/jwt';
import appConfig from '../../configs/app.config';
@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly jwtService: JwtService,
  ) {}

  async getAuthCache(key: string): Promise<any> {
    try {
      return await this.cache.get(key);
    } catch (error) {
      throw error;
    }
  }

  async updateAuthCacheByToken(authorization: string, deviceToken: string) {
    const cacheKey = `${AUTH_REDIS_CACHE_KEY}${authorization}`;
    const accessTokenInfo = await this.getAuthCache(cacheKey);
    accessTokenInfo.device_token = deviceToken;
    const millisecond = getUtcMillisecond();
    const ttl = Math.ceil((accessTokenInfo.expires_in - millisecond) / 1000);
    await this.cache.set(cacheKey, accessTokenInfo, {
      ttl: ttl + AUTH_REDIS_TTL_OVERDUE,
    });
  }

  async decodeJwtToken(token: string) {
    return await this.jwtService.verifyAsync(token, {
      secret: appConfig().jwtSecretKey,
    });
  }
}
