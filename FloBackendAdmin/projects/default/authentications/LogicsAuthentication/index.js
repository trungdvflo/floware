const _ = require('lodash');
const Code = require('../../constants/ResponseCodeConstant');
const Utils = require('../../utilities/Utils');
const AccountUtil = require('../../utilities/Accounts');
const CacheService = require('../../services/CacheService');

const {
  AccessTokenModel, AppRegisterModel, AdminModel
} = require('../../models');
const AppsConstant = require('../../constants/AppsConstant');
const MessageConstant = require('../../constants/MessageConstant');

const LogicsAuthentication = {
  ValidateOauth: async (request, h) => {
    try {
      const token = _.get(request, 'headers.authorization', _.get(request, 'query.token', false));
      const appId = _.get(request, 'headers.app_id', _.get(request, 'query.app_id', false));
      const deviceUid = _.get(request, 'headers.device_uid', _.get(request, 'query.device_uid', false));
      if (_.isEmpty(appId) === true) {
        return h.response({
          error: {
            code: Code.INVALID_PAYLOAD_PARAMS,
            message: MessageConstant.INVALID_APP_ID
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS).takeover();
      }

      if (_.isEmpty(token) === true) {
        return h.response({
          error: {
            code: Code.INVALID_PAYLOAD_PARAMS,
            message: MessageConstant.INVALID_AUTHORIZATION
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS).takeover();
      }

      let [tokenType, authorization] = token.split(/\s+/);
      if (_.isUndefined(authorization) || tokenType !== AppsConstant.TOKEN_TYPE) {
        // Authorization not has Bear
        authorization = tokenType;
      }

      const checkAppId = await AppRegisterModel.findOne({
        where: {
          app_reg_id: appId
        },
        raw: true
      });

      if (_.isUndefined(checkAppId) || _.isNull(checkAppId)) {
        return h.response({
          error: {
            code: Code.INVALID_PAYLOAD_PARAMS,
            message: MessageConstant.INVALID_APP_ID
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS).takeover();
      }

      const currentTimestamp = Utils.Timestamp();
      const accessTokenHex = Utils.getAccessTokenOAuth2(authorization);
      let accessTokenInfo = await CacheService.GetOAuthCache(accessTokenHex);

      if (_.isEmpty(accessTokenInfo) === true) {
        const tokenInfo = AccountUtil.TokenAESHandler(accessTokenHex, 'accessToken');
        accessTokenInfo = await AccessTokenModel.findOne({
          where: {
            app_id: appId,
            device_uid: deviceUid,
            access_token: tokenInfo.encrypted
          },
          raw: true
        });

        if (_.isEmpty(accessTokenInfo) === false) {
          await CacheService.SetOAuthCache(accessTokenInfo, tokenInfo.hex);
        }
      }
      // Check Expired Time in Access Token 
      if (
        _.isEmpty(accessTokenInfo) === false
        && accessTokenInfo.device_uid === deviceUid
        && accessTokenInfo.app_id === appId
        && currentTimestamp < accessTokenInfo.expires_in
        && accessTokenInfo.is_revoked === 0
      ) {
        const adminInfo = await AdminModel.findOne({
          where: { email: accessTokenInfo.email }
        });

        if (_.isEmpty(adminInfo) === true) {
          return h.response({
            error: {
              code: Code.INVALID_PERMISSION,
              message: MessageConstant.FORBIDDEN
            }
          }).code(Code.INVALID_PERMISSION).takeover();
        }

        return {
          id: accessTokenInfo.id,
          app_id: accessTokenInfo.app_id,
          device_uid: accessTokenInfo.device_uid,
          email: accessTokenInfo.email,
          user_id: accessTokenInfo.user_id,
          expires_in: accessTokenInfo.expires_in,
          access_token: accessTokenHex,
          user_agent: accessTokenInfo.user_agent,
          device_token: accessTokenInfo.device_token || null,
          role: adminInfo.role
        };
      }

      return h.response({
        error: {
          code: Code.INVALID_TOKEN,
          message: MessageConstant.UNAUTHORIZED_AUTHORIZATION_INFO_IS_UNDEFINED_OR_THE_WRONG_FORMAT
        }
      }).code(Code.INVALID_TOKEN).takeover();
    } catch (error) {
      return h.response({
        error: {
          code: Code.INVALID_TOKEN,
          message: MessageConstant.UNAUTHORIZED_AUTHORIZATION_INFO_IS_UNDEFINED_OR_THE_WRONG_FORMAT
        }
      }).code(Code.INVALID_TOKEN).takeover();
    }
  }
};

module.exports = LogicsAuthentication;
