import { MAIN_KEY_CACHE } from '../constants/common';

export class CacheUtil {
  static getCachePatterns(func: string, key: string, userId: number) {
    let mainKey = `${MAIN_KEY_CACHE}:${func}:${key}`;
    if (userId) {
      mainKey = `${MAIN_KEY_CACHE}:${userId}:${func}:${key}`;
    }
    return mainKey;
  }
  static getCacheOrderKey(userId: number, obj_type: string, req_uid: string) {
    return `${MAIN_KEY_CACHE}:order:${userId}:${obj_type}:${req_uid}`;
  }
}