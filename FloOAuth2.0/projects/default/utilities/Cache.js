/* eslint-disable default-param-last */
const _ = require('lodash');
const Cache = require('../caches/Cache');
const Utils = require('./Utils');
const WebAESAccessToken = require('./WebAESAccessToken');
const AppsConstant = require('../constants/AppsConstant');
const { AccessTokenModel } = require('../models/Sequelize');

const DestroyOAuthCache = async (accessTokenEncrypted = null, iv) => {
  if (_.isEmpty(accessTokenEncrypted) === false) {
    const accessToken = WebAESAccessToken.aes256Decrypt(accessTokenEncrypted.toString('hex'), AppsConstant.AES_KEY, iv.toString('hex'));
    const cacheKey = Utils.CachePatterns(AppsConstant.AUTHORIZATION_KEY_CACHE, accessToken);
    await Cache.del(cacheKey);
  }
  return true;
};

const DestroyAccessTokenCache = async (cacheKey = null, accessTokenInfo) => {
  if (_.isEmpty(accessTokenInfo) === false) {
    await Cache.del(cacheKey);
    await AccessTokenModel.destroy({
      where: {
        id: accessTokenInfo.id
      }
    });
  }
  return true;
};

const GetMigrateStatus = async (email = null) => {
  try {
    if (_.isEmpty(email) === false) {
      const cacheKey = `${AppsConstant.USER_MIGRATE_DATA_CACHE}${email}`;
      const migrateStatusJson = await Cache.get(cacheKey);

      if (_.isEmpty(migrateStatusJson) === false) {
        const migrateStatusObject = JSON.parse(migrateStatusJson);
        const migrateCode = _.get(migrateStatusObject, 'code', false);
        if (_.isNumber(migrateCode) === true) {
          const migratePercent = _.get(migrateStatusObject, 'percent', 0);
          return {
            migrateStatus: migrateCode,
            percent: migratePercent
          };
        }
      }
      return false;
    }
    return false;
  } catch (error) {
    return false;
  }
};

const SetMigrateStatus = async (email, accessToken) => {
  try {
    const cacheKey = `${AppsConstant.USER_MIGRATE_DATA_CACHE}${email}`;
    await Cache.set(cacheKey, JSON.stringify({
      code: AppsConstant.USER_MIGRATE_STATUS.INIT_MIGRATE,
      email,
      accessToken
    }), AppsConstant.USER_MIGRATE_DATA_JOB_TTL);
    return true;
  } catch (error) {
    return false;
  }
};

const GetRevertStatus = async (email = null) => {
  try {
    if (_.isEmpty(email) === false) {
      const cacheKey = `${AppsConstant.USER_REVERT_MIGRATE_DATA_CACHE}${email}`;
      const migrateStatusJson = await Cache.get(cacheKey);

      if (_.isEmpty(migrateStatusJson) === false) {
        const migrateStatusObject = JSON.parse(migrateStatusJson);
        const migrateCode = _.get(migrateStatusObject, 'code', false);
        if (_.isNumber(migrateCode) === true) {
          const migratePercent = _.get(migrateStatusObject, 'percent', 0);
          return {
            migrateStatus: migrateCode,
            percent: migratePercent
          };
        }
      }
      return false;
    }
    return false;
  } catch (error) {
    return false;
  }
};

const SetRevertStatus = async (email) => {
  try {
    const cacheKey = `${AppsConstant.USER_REVERT_MIGRATE_DATA_CACHE}${email}`;
    await Cache.set(cacheKey, JSON.stringify({
      email
    }), AppsConstant.USER_MIGRATE_DATA_JOB_TTL);
    return true;
  } catch (error) {
    return false;
  }
};

const GetOAuthCache = async (accessTokenHex = null) => {
  if (_.isEmpty(accessTokenHex) === false) {
    const cacheKey = Utils.CachePatterns(AppsConstant.AUTHORIZATION_KEY_CACHE, accessTokenHex);
    const accessTokenJson = await Cache.get(cacheKey);
    if (_.isEmpty(accessTokenJson) === false) {
      const accessTokenInfo = JSON.parse(accessTokenJson);
      const ttl = Math.ceil((accessTokenInfo.expires_in - Utils.Timestamp()) / 1000);
      if (ttl < 0) {
        await DestroyAccessTokenCache(cacheKey, accessTokenInfo);
        return false;
      }
      return accessTokenInfo;
    }
    return false;
  }
  return false;
};

const SetOAuthCache = async (accessTokenInfo, accessTokenHex) => {
  if (_.isEmpty(accessTokenInfo) === false) {
    const cacheKey = Utils.CachePatterns(AppsConstant.AUTHORIZATION_KEY_CACHE, accessTokenHex);
    const ttl = Math.ceil((accessTokenInfo.expires_in - Utils.Timestamp()) / 1000);
    if (ttl < 0) {
      await DestroyAccessTokenCache(cacheKey, accessTokenInfo);
      return false;
    }

    await Cache.set(cacheKey, JSON.stringify({
      ...accessTokenInfo
    }), ttl + AppsConstant.TTL_OVERDUE);
  }

  return true;
};

const GetMigratedPlatform = async (key = null) => {
  if (_.isEmpty(key) === false) {
    const cacheKey = Utils.CachePatterns(AppsConstant.MIGRATED_PLATFORM_KEY_CACHE, key);
    const cacheValue = await Cache.get(cacheKey);
    if (_.isEmpty(cacheValue) === false) {
      return cacheValue;
    }
    return false;
  }
  return false;
};

const SetMigratedPlatform = async (value, key) => {
  if (_.isEmpty(value) === false) {
    const cacheKey = Utils.CachePatterns(AppsConstant.MIGRATED_PLATFORM_KEY_CACHE, key);
    await Cache.set(cacheKey, JSON.stringify(value), AppsConstant.REFRESH_TOKEN_EXPIRE_TIME);
  }

  return true;
};

const SetRestrictedUser = async (rules) => {
  try {
    const cacheKey = `${AppsConstant.FLO_RESTRICTED_RULE}`;
    await Cache.set(cacheKey, JSON.stringify(rules), AppsConstant.FLO_RESTRICTED_RULE_TTL);
    return true;
  } catch (error) {
    return false;
  }
};

const GetCache = async (cacheKey) => {
  if (_.isEmpty(cacheKey) === false) {
    const cacheValue = await Cache.get(cacheKey);
    if (_.isEmpty(cacheValue) === false) {
      return JSON.parse(cacheValue);
    }
    return false;
  }
  return false;
};

module.exports = {
  DestroyOAuthCache,
  GetMigrateStatus,
  GetRevertStatus,
  SetMigrateStatus,
  SetRevertStatus,
  GetOAuthCache,
  SetOAuthCache,
  GetMigratedPlatform,
  SetMigratedPlatform,
  SetRestrictedUser,
  GetCache
};
