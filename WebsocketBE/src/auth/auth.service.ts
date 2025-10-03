import {
  BadRequestException,
  CACHE_MANAGER,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { AUTH_REDIS_CACHE_KEY, TYPE_TOKEN } from '../common/constants/oauth.constant';
import { ApiAuthHeader } from '../interface/api-auth-header.interface';
import { IUser } from '../interface/user.interface';

@Injectable()
export class AuthService {
  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cache: Cache,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async getAuthCache(key: string): Promise<any> {
    try {
      return await this.cache.get(key);
    } catch (error) {
      throw error;
    }
  }

  async verify(authHeaderInfo: ApiAuthHeader): Promise<IUser> {
    const { authorization, app_id, device_uid } = authHeaderInfo;
    if (!authorization || !app_id || !device_uid) {
      // return null
      throw new BadRequestException('auth header invalid!');
    }
    const accessToken = authorization.replace(TYPE_TOKEN, '');
    const cacheKey = `${AUTH_REDIS_CACHE_KEY}${accessToken}`;
    const userInfo = await this.getAuthCache(cacheKey);
    if (!userInfo?.user_id) {
      throw new UnauthorizedException('Unauthorized.');
    }

    const millisecond = Date.now();
    const ttl = Math.ceil((userInfo.expires_in - millisecond) / 1000);
    if (ttl <= 0) {
      throw new UnauthorizedException('Unauthorized. Your access token was expired.');
    }
    if (userInfo.device_uid !== device_uid || userInfo.app_id !== app_id) {
      throw new UnauthorizedException('Unauthorized. Your application registry is invalid');
    }
    return {
      userId: userInfo.user_id,
      email: userInfo.email,
      appId: userInfo.app_id,
      deviceUid: userInfo.device_uid,
    } as IUser;
  }

  async verifyWsAccessToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('app.ws_secret'),
      });
      return payload;
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
  }

  async verifySystemAccessToken(token: string) {
    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('app.ws_sercret'),
      });
      return payload as IUser;
    } catch {
      throw new UnauthorizedException('Unauthorized');
    }
  }
  async generateWsAccessToken(user: IUser) {
    return this.jwtService.signAsync(user);
  }
}
