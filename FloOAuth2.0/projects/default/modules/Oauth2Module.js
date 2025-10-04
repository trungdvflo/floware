const _ = require('lodash');
const tz = require('@touch4it/ical-timezones');
const { QueryTypes, Op, fn, col } = require('sequelize');
const Code = require('../constants/ResponseCodeConstant');
const AccountService = require('../services/AccountService');
const InternalAccountService = require('../services/InternalAccountService');
const OAuth2Constant = require('../constants/OAuth2Constant');
const AppsConstant = require('../constants/AppsConstant');
const MessageConstant = require('../constants/MessageConstant');
const TimezoneConstant = require('../constants/TimezoneConstant');
const Utils = require('../utilities/Utils');
const WebAESAccessToken = require('../utilities/WebAESAccessToken');
const CacheUtility = require('../utilities/Cache');
const Server = require('../app').server;

const {
  AccessTokenModel,
  UserModel,
  VirtualDomainModel,
  DeviceTokenModel
} = require('../models/Sequelize');

const GetIp = (request) => {
  const xFF = request.headers['x-forwarded-for'];
  const ip = xFF ? xFF.split(',')[0] : _.get(request, 'raw.req.connection.remoteAddress', '127.0.0.1');
  return ip;
};

module.exports = {
  Token: async (request, h) => {
    try {
      const { payload, headers } = request;
      const email = AccountService.HandleEmail(payload.username);
      if (!AccountService.ValidateEmailFormat(email)) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.USERNAME_MUST_BE_A_VALID_EMAIL
          }
        }).code(Code.INVALID_TOKEN);
      }

      const password = Utils.DecryptStringWithRsaPrivateKey(payload.password);

      if (password === false) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.AUTHENTICATION_FAILED
          }
        }).code(Code.INVALID_TOKEN);
      }

      // Check Valid Internal Email
      const authEmail = await InternalAccountService.FloMailInternalCheckAccountValid(email, password);
      if (_.isEmpty(authEmail) === true) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.AUTHENTICATION_FAILED
          }
        }).code(Code.INVALID_TOKEN);
      }

      // Check email in Database
      const userInfo = await UserModel.findOne({
        attributes: ['id', 'disabled'],
        where: {
          email,
          password: fn('ENCRYPT', [password], col('password'))
        },
        useMaster: true,
        raw: true
      });

      if (_.isNull(userInfo) === true && authEmail.is_valid === false) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.AUTHENTICATION_FAILED
          }
        }).code(Code.INVALID_TOKEN);
      }

      // check user is block
      const migrateStatus = await CacheUtility.GetMigrateStatus(email);
      const ip = GetIp(request);
      const nowTime = Utils.Timestamp();

      if (migrateStatus) {
        const tokenInfo = await AccountService.CreateMigrateAccessToken({
          username: email,
          app_id: headers.app_id,
          device_uid: headers.device_uid,
          ip,
          user_agent: request.headers?.user_agent ?? request.headers['user-agent'] ?? '',
          migrate_status: migrateStatus.migrateStatus
        });
        return h.response({
          data: {
            access_token: tokenInfo.accessToken,
            refresh_token: tokenInfo.refreshToken,
            token_type: AppsConstant.TOKEN_TYPE,
            expires_in: tokenInfo.expiresIn,
            migrate_status: migrateStatus.migrateStatus
          }
        }).code(Code.REQUEST_SUCCESS);
      }

      if (_.get(userInfo, 'disabled', false) === 1 || _.get(authEmail, 'disabled', false) === 1) {
        return h.response({
          error: {
            code: Code.FUNC_USER_BLOCK,
            message: MessageConstant.YOUR_ACCOUNT_HAS_BEEN_DISABLED_PLEASE_CONTACT_YOUR_ADMINISTRATOR
          }
        }).code(Code.INVALID_TOKEN);
      }
      if (_.isNull(userInfo) === true && authEmail.is_valid === true) {
        const tokenInfo = await AccountService.CreateMigrateAccessToken({
          username: email,
          app_id: headers.app_id,
          device_uid: headers.device_uid,
          ip,
          user_agent: request.headers?.user_agent ?? request.headers['user-agent'] ?? '',
          migrate_status: AppsConstant.USER_MIGRATE_STATUS.NOT_MIGRATE
        });
        return h.response({
          data: {
            access_token: tokenInfo.accessToken,
            refresh_token: tokenInfo.refreshToken,
            token_type: AppsConstant.TOKEN_TYPE,
            expires_in: tokenInfo.expiresIn,
            migrate_status: AppsConstant.USER_MIGRATE_STATUS.NOT_MIGRATE
          }
        }).code(Code.REQUEST_SUCCESS);
      }

      const accessTokenInfo = await AccessTokenModel.findOne({
        where: {
          user_id: userInfo.id,
          app_id: headers.app_id,
          device_uid: headers.device_uid,
          expires_in: {
            [Op.gt]: nowTime
          },
          is_revoked: 0
        },
        order: [['expires_in', 'DESC']],
        useMaster: true,
        raw: true
      });

      if (_.isEmpty(accessTokenInfo) === false) {
        const accessToken = WebAESAccessToken.aes256Decrypt(
          accessTokenInfo.access_token.toString('hex'),
          AppsConstant.AES_KEY,
          accessTokenInfo.access_token_iv.toString('hex')
        );

        const refreshToken = WebAESAccessToken.aes256Decrypt(
          accessTokenInfo.refresh_token.toString('hex'),
          AppsConstant.AES_KEY,
          accessTokenInfo.refresh_token_iv.toString('hex')
        );
        await CacheUtility.SetOAuthCache(accessTokenInfo, accessToken);
        await AccountService.UpdateQuota(email);
        return h.response({
          data: {
            access_token: accessToken,
            refresh_token: refreshToken,
            token_type: AppsConstant.TOKEN_TYPE,
            expires_in: accessTokenInfo.expires_in,
            migrate_status: AppsConstant.USER_MIGRATE_STATUS.MIGRATED
          }
        }).code(Code.REQUEST_SUCCESS);
      }

      const tokenInfo = await AccountService.CreateNewAccessToken({
        user_id: userInfo.id,
        username: email,
        app_id: headers.app_id,
        device_uid: headers.device_uid,
        ip,
        user_agent: request.headers?.user_agent ?? request.headers['user-agent'] ?? ''
      });

      // check and insert migrate platform information
      await AccountService.CreateReportCacheMigratePlatform(userInfo, headers.app_id);
      return h.response({
        data: {
          access_token: tokenInfo.accessToken,
          refresh_token: tokenInfo.refreshToken,
          token_type: AppsConstant.TOKEN_TYPE,
          expires_in: tokenInfo.expiresIn,
          migrate_status: AppsConstant.USER_MIGRATE_STATUS.MIGRATED
        }
      }).code(Code.REQUEST_SUCCESS);
    } catch (error) {
      Server.log(['OAuth2.0_ERROR'], error);
      throw error;
    }
  },

  SignUp: async (request, h) => {
    try {
      const { payload, headers } = request;
      const email = AccountService.HandleEmail(payload.username);
      const arrEmail = email.split('@');
      const username = _.get(arrEmail, '0', '');

      if (!AccountService.ValidateEmailFormat(email)) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.USERNAME_MUST_BE_A_VALID_EMAIL
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      const isRestrictedUsername = await AccountService.RestrictedUsername(username);

      if (isRestrictedUsername === true) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.EMAIL_IS_RESTRICTED
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
      const password = Utils.DecryptStringWithRsaPrivateKey(payload.password);
      if (password === false) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.INVALID_PASSWORD
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
      const isValidPassword = AccountService.ValidatePassword(password);
      if (isValidPassword.code === 0) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: isValidPassword.message
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      const digesta1 = Utils.MD5DavPassword(email, OAuth2Constant.REAL_NAME_DAV, password);
      const domain = await VirtualDomainModel.findOne({
        where: {
          name: arrEmail[1]
        },
        raw: true
      });

      if (_.isEmpty(payload.timezone) === false) {
        const timezone = TimezoneConstant[payload.timezone];
        if (_.isEmpty(timezone) === true) {
          payload.timezone = OAuth2Constant.TIMEZONE;
        }
      }

      if (_.isEmpty(domain) === true) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.INVALID_EMAIL
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      const query = `
      SELECT count(usercount) as usercount
      FROM (
        (SELECT id as usercount from user WHERE username = $email LIMIT 1)
          UNION
        (SELECT id as usercount from user_deleted WHERE username = $email LIMIT 1)
      ) AS usercounts;
      `;

      const userCounts = await UserModel.sequelize.query(query, {
        type: QueryTypes.SELECT,
        raw: true,
        bind: {
          email
        }
      });

      const userCount = Number(_.get(userCounts, '[0].usercount', '-1'));
      if (userCount !== 0) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.USER_ALREADY_EXIST
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      const opts = {
        timezone: payload.timezone,
        domain_id: domain.id,
        agCaldav: {
        },
        calendar_tz: tz
          .getVtimezone(OAuth2Constant.TIMEZONE)
          .replace(OAuth2Constant.TIMEZONE_REPLACE_STRING, OAuth2Constant.TIMEZONE_REPLACE_VALUE)
      };

      const userArgs = {
        username: email,
        email,
        password,
        digesta1,
        domain_id: domain.id,
        appreg_id: headers.app_id,
        fullname: _.get(payload, 'fullname', _.get(arrEmail, '0', '')),
        rsa: payload.password,
        secondary_email: _.get(payload, 'secondary_email', ''),
        birthday: 0,
        description: 'Flo',
        token: '',
        token_expire: 0.000,
        updated_date: Utils.TimestampDouble(),
        created_date: Utils.TimestampDouble()
      };

      const result = await AccountService.CreateUser(userArgs, opts);
      if (result.code === -1) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.USER_ALREADY_EXIST
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
      if (result.code === 0) {
        return h.response({
          error: {
            message: MessageConstant.INTERNAL_SERVER_ERROR
          }
        }).code(Code.SYSTEM_ERROR);
      }

      const ip = GetIp(request);
      const tokenInfo = await AccountService.CreateNewAccessToken({
        user_id: result.user.id,
        app_id: headers.app_id,
        device_uid: headers.device_uid,
        ip,
        username: email,
        user_agent: request.headers?.user_agent ?? request.headers['user-agent'] ?? ''
      });
      // auto add test account to group
      const internalGroup = _.get(payload, 'internal_group', 0);
      AccountService.CheckAccountTestAndAddGroup(result.user, internalGroup);

      return h.response({
        data: {
          access_token: tokenInfo.accessToken,
          refresh_token: tokenInfo.refreshToken,
          token_type: AppsConstant.TOKEN_TYPE,
          expires_in: tokenInfo.expiresIn
        }
      }).code(Code.REQUEST_SUCCESS);
    } catch (error) {
      Server.log(['OAuth2.0_ERROR'], error);
      throw error;
    }
  },

  Revoke: async (request, h) => {
    try {
      const { payload } = request;

      const accessTokenInfo = _.get(request, 'auth.credentials', false);
      if (_.isEmpty(accessTokenInfo) === true) {
        return h.response({
          error: {
            code: Code.FUNC_INVALID_ACCESS_TOKEN,
            message: MessageConstant.INVALID_ACCESS_TOKEN_INFORMATION
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      switch (payload.revoke_type) {
        case 'all_device': {
          const returnCode = await AccountService.RevokeToken(accessTokenInfo.user_id);
          if (returnCode === false) {
            return h.response({
              error: {
                code: Code.FUNC_BAD_REQUEST,
                message: MessageConstant.REVOKE_ACCESSTOKEN_FAILED
              }
            }).code(Code.INVALID_PAYLOAD_PARAMS);
          }
          // Delete all device_token of User
          await DeviceTokenModel.destroy({
            where: {
              user_id: accessTokenInfo.user_id
            }
          });
          break;
        }
        default: {
          // on_device case
          const returnCode = await AccountService.RevokeTokenByAccessToken(accessTokenInfo);
          if (returnCode === false) {
            return h.response({
              error: {
                code: Code.FUNC_BAD_REQUEST,
                message: MessageConstant.REVOKE_ACCESSTOKEN_FAILED
              }
            }).code(Code.INVALID_PAYLOAD_PARAMS);
          }

          if (_.isEmpty(accessTokenInfo.device_token) === false) {
            await DeviceTokenModel.destroy({
              where: {
                user_id: accessTokenInfo.user_id,
                device_token: accessTokenInfo.device_token
              }
            });
          }
          break;
        }
      }

      return h.response({
        data: {
          is_revoke: true
        }
      }).code(Code.REQUEST_SUCCESS);
    } catch (error) {
      Server.log(['OAuth2.0_ERROR'], error);
      throw error;
    }
  },

  RefreshToken: async (request, h) => {
    try {
      const { payload, headers } = request;
      const refreshToken = AccountService.TokenAESHandler(payload.refresh_token, 'refreshToken');
      if (refreshToken === false) {
        return h.response({
          error: {
            code: Code.FUNC_INVALID_REFRESH_TOKEN,
            message: MessageConstant.INVALID_REFRESH_TOKEN_INFORMATION
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      const accessTokenInfo = await AccessTokenModel.findOne({
        where: {
          app_id: headers.app_id,
          device_uid: headers.device_uid,
          refresh_token: refreshToken.encrypted
        },
        order: [['expires_in', 'DESC']],
        useMaster: true,
        raw: true
      });

      if (_.isEmpty(accessTokenInfo) === true) {
        return h.response({
          error: {
            code: Code.FUNC_INVALID_REFRESH_TOKEN,
            message: MessageConstant.INVALID_REFRESH_TOKEN_INFORMATION
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }
      const nowTime = Utils.Timestamp();
      // Check Refresh Token has expired or revoke
      if (accessTokenInfo.is_revoked === 1 || nowTime > accessTokenInfo.expires_in_refresh_token) {
        return h.response({
          error: {
            code: Code.FUNC_REFRESH_TOKEN_EXPIRED,
            message: MessageConstant.REFRESH_TOKEN_HAS_EXPIRED
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      if (accessTokenInfo.expires_in > nowTime) {
        const currentAccessToken = WebAESAccessToken.aes256Decrypt(
          accessTokenInfo.access_token.toString('hex'),
          AppsConstant.AES_KEY,
          accessTokenInfo.access_token_iv.toString('hex')
        );

        const currentRefreshToken = WebAESAccessToken.aes256Decrypt(
          accessTokenInfo.refresh_token.toString('hex'),
          AppsConstant.AES_KEY,
          accessTokenInfo.refresh_token_iv.toString('hex')
        );

        await CacheUtility.SetOAuthCache(accessTokenInfo, currentAccessToken);

        return h.response({
          data: {
            access_token: currentAccessToken,
            refresh_token: currentRefreshToken,
            token_type: AppsConstant.TOKEN_TYPE,
            expires_in: accessTokenInfo.expires_in
          }
        }).code(Code.REQUEST_SUCCESS);
      }

      const userInfo = await UserModel.findOne({
        where: {
          email: accessTokenInfo.email
        },
        useMaster: true,
        raw: true
      });

      if (_.isNull(userInfo) === true) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.USER_INFORMATION_DOES_NOT_EXIST
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      // check user is block
      if (userInfo.disabled === 1) {
        return h.response({
          error: {
            code: Code.FUNC_USER_BLOCK,
            message: MessageConstant.YOUR_ACCOUNT_HAS_BEEN_DISABLED_PLEASE_CONTACT_YOUR_ADMINISTRATOR
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      const revoke = await AccountService.RevokeTokenByRefreshToken(accessTokenInfo);
      if (revoke === false) {
        return h.response({
          error: {
            message: MessageConstant.INTERNAL_SERVER_ERROR
          }
        }).code(Code.SYSTEM_ERROR);
      }

      const accessToken = await AccessTokenModel.findOne({
        attributes: ['device_token'],
        where: {
          user_id: accessTokenInfo.user_id,
          app_id: accessTokenInfo.app_id,
          device_uid: accessTokenInfo.device_uid,
          device_token: {
            [Op.not]: null
          }
        },
        order: [['expires_in', 'DESC']]
      });

      const ip = GetIp(request);

      // Create new access token
      const tokenInfo = await AccountService.RefreshAccessToken({
        user_id: userInfo.id,
        app_id: accessTokenInfo.app_id,
        device_uid: accessTokenInfo.device_uid,
        device_token: _.get(accessToken, 'device_token', null),
        ip,
        username: accessTokenInfo.email,
        user_agent: request.headers?.user_agent ?? request.headers['user-agent'] ?? ''
      }, refreshToken);

      if (tokenInfo !== false) {
        return h.response({
          data: {
            access_token: tokenInfo.accessToken,
            refresh_token: tokenInfo.refreshToken,
            token_type: AppsConstant.TOKEN_TYPE,
            expires_in: tokenInfo.expiresIn
          }
        }).code(Code.REQUEST_SUCCESS);
      }
      return h.response({
        error: {
          code: Code.FUNC_BAD_REQUEST,
          message: MessageConstant.REFRESH_TOKEN_FAILED
        }
      }).code(Code.INVALID_PAYLOAD_PARAMS);
    } catch (error) {
      Server.log(['OAuth2.0_ERROR'], error);
      throw error;
    }
  },

  ChangePassword: async (request, h) => {
    const t = await UserModel.sequelize.transaction();
    try {
      const { payload } = request;

      const accessTokenInfo = _.get(request, 'auth.credentials', false);
      const password = Utils.DecryptStringWithRsaPrivateKey(payload.new_password);

      if (password === false) {
        await t.rollback();
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.INVALID_PASSWORD
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      const isValidPassword = AccountService.ValidatePassword(password);
      if (isValidPassword.code === 0) {
        await t.rollback();
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: isValidPassword.message
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      const where = {
        id: accessTokenInfo.user_id
      };

      // Keep this code for future update
      // if (_.isEmpty(payload.current_password) === false) {
      //   const currentPassword = Utils.DecryptStringWithRsaPrivateKey(payload.current_password);
      //   where.password = fn('ENCRYPT', currentPassword, col('password'));
      // }

      const userInfo = await UserModel.findOne({
        attributes: ['email', 'password', 'disabled'],
        where,
        useMaster: true,
        raw: true
      });

      if (_.isNull(userInfo)) {
        await t.rollback();
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.INVALID_ACCOUNT_INFORMATION
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      // check user is block
      if (userInfo.disabled === 1) {
        await t.rollback();
        return h.response({
          error: {
            code: Code.FUNC_USER_BLOCK,
            message: MessageConstant.YOUR_ACCOUNT_HAS_BEEN_DISABLED_PLEASE_CONTACT_YOUR_ADMINISTRATOR
          }
        }).code(Code.INVALID_TOKEN);
      }

      const digesta1 = Utils.MD5DavPassword(userInfo.email, OAuth2Constant.REAL_NAME_DAV, password);
      const query = `
                UPDATE user
                SET 
                    password = ENCRYPT($password, CONCAT($prefix, SUBSTRING(SHA(RAND()), $saltLength))),
                    digesta1 = $digesta1,
                    rsa = $payloadPassword 
                WHERE id = $userId
            `;
      const updateQuery = await UserModel.sequelize.query(query, {
        type: QueryTypes.UPDATE,
        raw: true,
        returning: true,
        transaction: t,
        bind: {
          prefix: '$6$',
          saltLength: `${AppsConstant.SALT_LENGTH}`,
          password,
          digesta1,
          payloadPassword: payload.new_password,
          userId: accessTokenInfo.user_id
        }
      });

      const updateStatus = _.get(updateQuery, '1', 0);
      if (updateStatus !== 1) {
        await t.rollback();
        return h.response({
          error: {
            message: MessageConstant.INTERNAL_SERVER_ERROR
          }
        }).code(Code.SYSTEM_ERROR);
      }

      const user = await UserModel.findOne({
        where: {
          id: accessTokenInfo.user_id
        },
        transaction: t,
        useMaster: true,
        raw: true
      });

      const floMailInternalChangePassword = await InternalAccountService.FloMailInternalChangePassword(user.username, user.password, t);
      if (floMailInternalChangePassword === false) {
        await t.rollback();
        return h.response({
          error: {
            message: MessageConstant.INTERNAL_SERVER_ERROR
          }
        }).code(Code.SYSTEM_ERROR);
      }

      const revoke = await AccountService.RevokeToken(accessTokenInfo.user_id);
      if (revoke === false) {
        await t.rollback();
        return h.response({
          error: {
            message: MessageConstant.INTERNAL_SERVER_ERROR
          }
        }).code(Code.SYSTEM_ERROR);
      }

      const accessToken = await AccessTokenModel.findOne({
        attributes: ['device_token'],
        where: {
          user_id: accessTokenInfo.user_id,
          app_id: accessTokenInfo.app_id,
          device_uid: accessTokenInfo.device_uid,
          device_token: {
            [Op.not]: null
          }
        },
        order: [['expires_in', 'DESC']]
      });

      const ip = GetIp(request);
      const tokenInfo = await AccountService.CreateNewAccessToken({
        user_id: accessTokenInfo.user_id,
        username: accessTokenInfo.email,
        app_id: accessTokenInfo.app_id,
        device_uid: accessTokenInfo.device_uid,
        device_token: _.get(accessToken, 'device_token', null),
        ip,
        user_agent: request.headers?.user_agent ?? request.headers['user-agent'] ?? ''
      });

      await t.commit();
      // Delete all device_token of User
      await DeviceTokenModel.destroy({
        where: {
          user_id: accessTokenInfo.user_id
        }
      });
      return h.response({
        data: {
          access_token: tokenInfo.accessToken,
          refresh_token: tokenInfo.refreshToken,
          token_type: AppsConstant.TOKEN_TYPE,
          expires_in: tokenInfo.expiresIn
        }
      }).code(Code.REQUEST_SUCCESS);
    } catch (error) {
      await t.rollback();
      Server.log(['OAuth2.0_ERROR'], error);
      throw error;
    }
  },

  ResetPassword: async (request, h) => {
    const t = await UserModel.sequelize.transaction();
    try {
      const { payload } = request;

      const password = Utils.DecryptStringWithRsaPrivateKey(payload.password);
      if (password === false) {
        await t.rollback();
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.INVALID_PASSWORD
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      const isValidPassword = AccountService.ValidatePassword(password);
      if (isValidPassword.code === 0) {
        await t.rollback();
        return h.response({

          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: isValidPassword.message
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      const userInfo = await UserModel.findOne({
        attributes: ['id', 'email', 'disabled'],
        where: {
          token: payload.token,
          token_expire: {
            [Op.gte]: Utils.TimestampDouble() - AppsConstant.ACCESS_TOKEN_EXPIRE_TIME
          }
        },
        useMaster: true,
        raw: true
      });

      if (_.isEmpty(userInfo) === true) {
        await t.rollback();
        return h.response({

          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.INVALID_TOKEN_OR_ALREADY_EXPIRED
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      if (userInfo.disabled === 1) {
        await t.rollback();
        return h.response({

          error: {
            code: Code.FUNC_USER_BLOCK,
            message: MessageConstant.YOUR_ACCOUNT_HAS_BEEN_DISABLED_PLEASE_CONTACT_YOUR_ADMINISTRATOR
          }
        }).code(Code.INVALID_TOKEN);
      }

      const digesta1 = Utils.MD5DavPassword(userInfo.email, OAuth2Constant.REAL_NAME_DAV, password);
      const query = `
                UPDATE user
                SET 
                    token = '',
                    token_expire = 0.000,
                    password = ENCRYPT($password, CONCAT($prefix, SUBSTRING(SHA(RAND()), ${AppsConstant.SALT_LENGTH}))),
                    digesta1 = $digesta1,
                    rsa = $payloadPassword 
                WHERE id = $userId
            `;

      const updateQuery = await UserModel.sequelize.query(query, {
        type: QueryTypes.UPDATE,
        raw: true,
        returning: true,
        transaction: t,
        bind: {
          prefix: '$6$',
          password,
          digesta1,
          payloadPassword: payload.password,
          userId: userInfo.id
        }
      });

      const updateStatus = _.get(updateQuery, '1', 0);
      if (updateStatus !== 1) {
        await t.rollback();
        return h.response({
          error: {
            message: MessageConstant.INTERNAL_SERVER_ERROR
          }
        }).code(Code.SYSTEM_ERROR);
      }

      const user = await UserModel.findOne({
        where: {
          id: userInfo.id
        },
        transaction: t,
        useMaster: true,
        raw: true
      });

      const floMailInternalChangePassword = await InternalAccountService.FloMailInternalChangePassword(user.username, user.password, t);
      if (floMailInternalChangePassword === false) {
        await t.rollback();
        return h.response({
          error: {
            message: MessageConstant.INTERNAL_SERVER_ERROR
          }
        }).code(Code.SYSTEM_ERROR);
      }

      const revoke = await AccountService.RevokeToken(userInfo.id);
      if (revoke === false) {
        await t.rollback();
        return h.response({
          error: {
            message: MessageConstant.INTERNAL_SERVER_ERROR
          }
        }).code(Code.SYSTEM_ERROR);
      }
      await t.commit();
      // Delete all device_token of User
      await DeviceTokenModel.destroy({
        where: {
          user_id: userInfo.id
        }
      });

      return h.response({
        data: {
          is_reset: true
        }
      }).code(Code.REQUEST_SUCCESS);
    } catch (error) {
      await t.rollback();
      Server.log(['OAuth2.0_ERROR'], error);
      throw error;
    }
  },

  CheckEmail: async (request, h) => {
    try {
      const { payload } = request;

      const email = AccountService.HandleEmail(payload.email);
      if (!AccountService.ValidateEmail(email)) {
        return h.response({
          error: {
            code: Code.FUNC_BAD_REQUEST,
            message: MessageConstant.EMAIL_FORMAT_IS_NOT_VALID
          }
        }).code(Code.INVALID_PAYLOAD_PARAMS);
      }

      const query = `
        SELECT SUM(usercount) as usercount
        FROM (
          SELECT COUNT(id) as usercount from user WHERE username = $email
          UNION ALL
          SELECT COUNT(id) as usercount from user_deleted WHERE username = $email
          UNION ALL
          SELECT COUNT(id) as usercount from email_group WHERE group_name = $email
        ) AS usercounts
      `;

      const user = await UserModel.sequelize.query(query, {
        type: QueryTypes.SELECT,
        raw: true,
        bind: {
          email
        }
      });

      const userCount = Number(_.get(user, '[0].usercount', '-1'));
      if (userCount !== 0) {
        return h.response({
          data: {
            is_exist: true
          }
        }).code(Code.REQUEST_SUCCESS);
      }

      const mailInternalExist = await InternalAccountService.FloMailInternalCheckAccountExist(email);
      if (mailInternalExist === true) {
        return h.response({
          data: {
            is_exist: true
          }
        }).code(Code.REQUEST_SUCCESS);
      }

      return h.response({
        data: {
          is_exist: false
        }
      }).code(Code.REQUEST_SUCCESS);
    } catch (error) {
      Server.log(['OAuth2.0_ERROR'], error);
      throw error;
    }
  }
};
