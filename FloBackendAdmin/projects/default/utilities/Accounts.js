const AsyncForEach = require('await-async-foreach');
const _ = require('lodash');
const AppsConstant = require('../constants/AppsConstant');
const WebAESAccessToken = require('./WebAESAccessToken');
const CacheService = require('../services/CacheService');
const Utils = require('./Utils');

const { AccessTokenModel } = require('../models');
const { log } = require('handlebars');

const Accounts = {
  RevokeToken: async (userId) => {
    try {
      // Destroy all cache
      const accessTokens = await AccessTokenModel.findAll({
        attributes: ['id', 'access_token_iv', 'access_token'],
        where: {
          user_id: userId
        },
        returning: true
      });

      const accessTokenIds = [];
      await AsyncForEach(accessTokens, async (accessToken) => {
        // Fix bug: FB-2190 19-Apr-2023 by KhoaPM
        const cacheKey = Utils.CachePatterns(AppsConstant.AUTHORIZATION_KEY_CACHE,
          WebAESAccessToken.aes256Decrypt(
            accessToken.access_token.toString('hex'),
            AppsConstant.AES_KEY,
            accessToken.access_token_iv.toString('hex')
          ));

        await CacheService.DestroyOAuthCache(cacheKey, accessToken);

        accessTokenIds.push(accessToken.id);
      });

      // Revoke all Access Token
      if (_.isEmpty(accessTokenIds) === false) {
        await AccessTokenModel.destroy({
          where: {
            id: accessTokenIds
          }
        });
      }

      return true;
    } catch (error) {
      return false;
    }
  },
  TokenAESHandler: (token, type) => {
    if (type === 'accessToken' && token.length !== (AppsConstant.ACCESS_TOKEN_LENGTH + AppsConstant.IV_LENGTH)) return false;
    if (type === 'refreshToken' && token.length !== (AppsConstant.REFRESH_TOKEN_LENGTH + AppsConstant.IV_LENGTH)) return false;

    const tokenBin = Buffer.from(token, 'hex');
    const iv = Buffer.alloc(AppsConstant.IV_LENGTH_IN_BYTE);
    tokenBin.copy(iv, 0, 0, AppsConstant.IV_LENGTH_IN_BYTE);
    const tokenEncrypted = WebAESAccessToken.aes256EncryptBuffer(token, AppsConstant.AES_KEY, iv.toString('hex'));
    return {
      iv,
      hex: token,
      encrypted: tokenEncrypted
    };
  }
};
module.exports = Accounts;

