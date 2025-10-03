const _ = require('lodash');
const Cache = require('../caches/Cache');
const Utils = require('../utilities/Utils');
const AppsConstant = require('../constants/AppsConstant');

const { AccessTokenModel } = require('../models');

const DestroyOAuthCache = async (cacheKey = null, accessTokenInfo) => {
  if (_.isEmpty(accessTokenInfo) === false) {
    await Cache.del(cacheKey);
    if (accessTokenInfo.id) {
      await AccessTokenModel.destroy({
        where: {
          id: accessTokenInfo.id
        }
      });
    }
  }
  return true;
};

const GetOAuthCache = async (accessTokenHex = null) => {
  if (_.isEmpty(accessTokenHex) === false) {
    const cacheKey = Utils.CachePatterns(AppsConstant.AUTHORIZATION_KEY_CACHE, accessTokenHex);
    const accessTokenJson = await Cache.get(cacheKey);
    if (_.isEmpty(accessTokenJson) === false) {
      const accessTokenInfo = JSON.parse(accessTokenJson);
      const ttl = Math.ceil((accessTokenInfo.expires_in - Utils.Timestamp()) / 1000);
      if (ttl < 0 || accessTokenJson.user_id < 1) {
        await DestroyOAuthCache(cacheKey, accessTokenInfo);
        return false;
      }
      return accessTokenInfo;
    }
    return false;
  }
  return false;
};

module.exports = {
  DestroyOAuthCache,
  GetOAuthCache
};
