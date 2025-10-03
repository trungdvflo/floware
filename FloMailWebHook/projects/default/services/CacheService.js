const _ = require('lodash');
const Cache = require('../caches/Cache');
const Utils = require('../utilities/Utils');
const WebAESAccessToken = require('../utilities/WebAESAccessToken');
const AppsConstant = require('../constants/AppsConstant');

module.exports = {
  DestroyOAuthCache: async (accessTokenEncrypted = null, iv) => {
    if (_.isEmpty(accessTokenEncrypted) === false) {
      const accessToken = WebAESAccessToken.aes256Decrypt(accessTokenEncrypted.toString('hex'), AppsConstant.AES_KEY, iv.toString('hex'));
      const cacheKey = Utils.CachePatterns(AppsConstant.AUTHORIZATION_KEY_CACHE, accessToken);
      await Cache.del(cacheKey);
    }
    return true;
  },

  GetOAuthCache: async (accessTokenHex = null) => {
    if (_.isEmpty(accessTokenHex) === false) {
      const cacheKey = Utils.CachePatterns(AppsConstant.AUTHORIZATION_KEY_CACHE, accessTokenHex);
      const accessTokenJson = await Cache.get(cacheKey);
      if (_.isEmpty(accessTokenJson) === false) {
        const accessTokenInfo = JSON.parse(accessTokenJson);
        const ttl = Math.ceil((accessTokenInfo.expires_in - Utils.Timestamp()) / 1000);
        if (ttl < 0) {
          await Cache.DestroyOAuthCache(accessTokenInfo.accessTokenHex, accessTokenInfo.access_token_iv);
          return false;
        }
        return accessTokenInfo;
      }
      return false;
    }
    return false;
  },

  SetOAuthCache: async (accessTokenInfo, accessTokenHex) => {
    if (_.isEmpty(accessTokenInfo) === false) {
      const cacheKey = Utils.CachePatterns(AppsConstant.AUTHORIZATION_KEY_CACHE, accessTokenHex);
      const ttl = Math.ceil((accessTokenInfo.expires_in - Utils.Timestamp()) / 1000);
      if (ttl < 0) {
        await Cache.DestroyOAuthCache(accessTokenHex, accessTokenInfo.access_token_iv);
        return false;
      }

      await Cache.set(cacheKey, JSON.stringify({
        id: accessTokenInfo.id,
        app_id: accessTokenInfo.app_id,
        device_uid: accessTokenInfo.device_uid,
        device_token: accessTokenInfo.device_token || null,
        email: accessTokenInfo.email,
        user_id: accessTokenInfo.user_id,
        expires_in: accessTokenInfo.expires_in,
        is_revoked: accessTokenInfo.is_revoked || 0,
        user_agent: accessTokenInfo.user_agent,
        previous_refresh_token: accessTokenInfo.previous_refresh_token
      }), ttl + AppsConstant.TTL_OVERDUE);
    }

    return true;
  }
};
