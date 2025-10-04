const _ = require('lodash');
const Code = require('../../constants/ResponseCodeConstant');
const Utils = require('../../utilities/Utils');
const CacheUtility = require('../../utilities/Cache');
const AppsConstant = require('../../constants/AppsConstant');
const MessageConstant = require('../../constants/MessageConstant');
const AppRegisterConstant = require('../../constants/AppRegisterConstant');

const LogicsAuthentication = {
  ValidateAppId: async (h, appId) => {
    try {
      const checkAppId = _.find(AppRegisterConstant, {
        app_reg_id: appId
      });

      if (_.isUndefined(checkAppId) || _.isNull(checkAppId)) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.INVALID_APP_ID
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS).takeover();
      }

      return checkAppId;
    } catch (error) {
      return h.response({
        error: {
          code: Code.FUNC_BAD_REQUEST,
          message: MessageConstant.INVALID_APP_ID
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS).takeover();
    }
  },

  ValidateOauth: async (request, h) => {
    try {
      const token = _.get(request, 'headers.authorization', false);
      const appId = _.get(request, 'headers.app_id', false);
      const { headers } = request;
      const [tokenType, authorization] = token.split(/\s+/);

      const checkAppId = _.find(AppRegisterConstant, {
        app_reg_id: appId
      });

      if (_.isUndefined(checkAppId) || _.isNull(checkAppId)) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.INVALID_APP_ID
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS).takeover();
      }

      if (_.isUndefined(authorization) || tokenType !== AppsConstant.TOKEN_TYPE) {
        return h.response({
          error: {
            code: Code.FUNC_UNAUTHORIZED,
            message: MessageConstant.UNAUTHORIZED_AUTHORIZATION_INFO_IS_UNDEFINED_OR_THE_WRONG_FORMAT
          }
        }).code(Code.INVALID_TOKEN).takeover();
      }

      const nowTime = Utils.Timestamp();
      const accessTokenHex = Utils.getAccessTokenOAuth2(authorization);
      const accessTokenInfo = await CacheUtility.GetOAuthCache(accessTokenHex);
      if (
        _.isEmpty(accessTokenInfo) === false
        && accessTokenInfo.device_uid === headers.device_uid
        && accessTokenInfo.app_id === headers.app_id
        && nowTime < accessTokenInfo.expires_in
        && accessTokenInfo.is_revoked === 0
        && _.isNumber(accessTokenInfo.user_id) === true
      ) {
        return {
          id: accessTokenInfo.id,
          app_id: accessTokenInfo.app_id,
          device_uid: accessTokenInfo.device_uid,
          email: accessTokenInfo.email,
          user_id: accessTokenInfo.user_id,
          expires_in: accessTokenInfo.expires_in,
          access_token: accessTokenHex,
          user_agent: accessTokenInfo.user_agent,
          device_token: accessTokenInfo.device_token || null
        };
      }

      return h.response({
        error: {
          code: Code.FUNC_UNAUTHORIZED,
          message: MessageConstant.UNAUTHORIZED_AUTHORIZATION_INFO_IS_UNDEFINED_OR_THE_WRONG_FORMAT
        }
      }).code(Code.INVALID_TOKEN).takeover();
    } catch (error) {
      return h.response({
        error: {
          code: Code.FUNC_UNAUTHORIZED,
          message: MessageConstant.UNAUTHORIZED_AUTHORIZATION_INFO_IS_UNDEFINED_OR_THE_WRONG_FORMAT
        }
      }).code(Code.INVALID_TOKEN).takeover();
    }
  },

  ValidateMigrate: async (request, h) => {
    try {
      const token = _.get(request, 'headers.authorization', false);
      const appId = _.get(request, 'headers.app_id', false);
      const { headers } = request;
      const [tokenType, authorization] = token.split(/\s+/);

      const checkAppId = _.find(AppRegisterConstant, {
        app_reg_id: appId
      });

      if (_.isUndefined(checkAppId) || _.isNull(checkAppId)) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.INVALID_APP_ID
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS).takeover();
      }

      if (_.isUndefined(authorization) || tokenType !== AppsConstant.TOKEN_TYPE) {
        return h.response({
          error: {
            code: Code.FUNC_UNAUTHORIZED,
            message: MessageConstant.UNAUTHORIZED_AUTHORIZATION_INFO_IS_UNDEFINED_OR_THE_WRONG_FORMAT
          }
        }).code(Code.INVALID_TOKEN).takeover();
      }
      const nowTime = Utils.Timestamp();
      const accessTokenHex = Utils.getAccessTokenOAuth2(authorization);
      const accessTokenInfo = await CacheUtility.GetOAuthCache(accessTokenHex);

      if (_.isEmpty(accessTokenInfo) === true) {
        return h.response({
          error: {
            code: Code.FUNC_UNAUTHORIZED,
            message: MessageConstant.UNAUTHORIZED_AUTHORIZATION_INFO_IS_UNDEFINED_OR_THE_WRONG_FORMAT
          }
        }).code(Code.INVALID_TOKEN).takeover();
      }

      // Check Expired Time in Access Token 
      if (
        _.isEmpty(accessTokenInfo) === false
        && accessTokenInfo.device_uid === headers.device_uid
        && accessTokenInfo.app_id === headers.app_id
        && nowTime < accessTokenInfo.expires_in
        && accessTokenInfo.is_revoked === 0
      ) {
        return {
          app_id: accessTokenInfo.app_id,
          device_uid: accessTokenInfo.device_uid,
          email: accessTokenInfo.email,
          expires_in: accessTokenInfo.expires_in,
          access_token: accessTokenHex,
          user_agent: accessTokenInfo.user_agent,
          device_token: accessTokenInfo.device_token || null,
          migrate_status: accessTokenInfo.migrate_status

        };
      }

      return h.response({
        error: {
          code: Code.FUNC_UNAUTHORIZED,
          message: MessageConstant.UNAUTHORIZED_AUTHORIZATION_INFO_IS_UNDEFINED_OR_THE_WRONG_FORMAT
        }
      }).code(Code.INVALID_TOKEN).takeover();
    } catch (error) {
      return h.response({
        error: {
          code: Code.FUNC_UNAUTHORIZED,
          message: MessageConstant.UNAUTHORIZED_AUTHORIZATION_INFO_IS_UNDEFINED_OR_THE_WRONG_FORMAT
        }
      }).code(Code.INVALID_TOKEN).takeover();
    }
  }
};

module.exports = LogicsAuthentication;
