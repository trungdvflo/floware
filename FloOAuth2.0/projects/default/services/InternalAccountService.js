/* eslint-disable prefer-regex-literals */
const _ = require('lodash');
const AppsConstant = require('../constants/AppsConstant');
const OAuth2Constant = require('../constants/OAuth2Constant');
const Request = require('../utilities/Request');
const { log } = require('async');
const Server = require('../app').server;

const InternalAccountService = {
  // Will return true for all exception case
  FloMailInternalCheckAccountValid: async (username, password) => {
    try {
      // 
      const url = `${AppsConstant.INTERNAL_MAIL_URL}/user/authentication`;
      const bast64Password = Buffer.from(password).toString('base64');
      const result = await Request.Post(url, {
        username, password: bast64Password
      }, null, null, AppsConstant.INTERNAL_MAIL_REQUEST_TIMEOUT);
      if (result.statusCode !== 200) {
        return false;
      }
      const body = typeof result.body === 'string'
        ? JSON.parse(result.body)
        : result.body;
      return _.get(body, 'data', false);
    } catch (error) {
      Server.log(['OAuth2.0_ERROR'], error);
      return true;
    }
  },

  // Will return true for all exception case
  FloMailInternalCheckAccountExist: async (email) => {
    try {
      // 
      const url = `${AppsConstant.INTERNAL_MAIL_URL}/user/checkemail`;
      const result = await Request.Post(url, {
        email
      }, null, null, AppsConstant.INTERNAL_MAIL_REQUEST_TIMEOUT);
      if (result.statusCode !== 200) {
        return true;
      }
      const body = typeof result.body === 'string'
        ? JSON.parse(result.body)
        : result.body;
      return _.get(body, 'data.is_exist', true);
    } catch (error) {
      Server.log(['OAuth2.0_ERROR'], error);
      return true;
    }
  },

  // Will return false for all exception case
  FloMailInternalSignUp: async (username, password) => {
    try {
      const url = `${AppsConstant.INTERNAL_MAIL_URL}/user/signup`;
      const result = await Request.Post(url, {
        username, password
      }, null, null, AppsConstant.INTERNAL_MAIL_REQUEST_TIMEOUT);
      const body = typeof result.body === 'string'
        ? JSON.parse(result.body)
        : result.body;
      // user existed
      if (body?.error?.code === 'badRequest') {
        return -1;
      }

      if (result.statusCode !== 200) {
        return false;
      }

      return _.get(body, 'data.is_signup', false);
    } catch (error) {
      Server.log(['OAuth2.0_ERROR'], error);
      return false;
    }
  },

  // Will return false for all exception case
  FloMailInternalChangePassword: async (username, password) => {
    try {
      const url = `${AppsConstant.INTERNAL_MAIL_URL}/user/changepass`;
      const result = await Request.Post(url, {
        username, new_password: password
      }, null, null, AppsConstant.INTERNAL_MAIL_REQUEST_TIMEOUT);
      if (result.statusCode !== 200) {
        return false;
      }

      const body = typeof result.body === 'string'
        ? JSON.parse(result.body)
        : result.body;
      return _.get(body, 'data.is_reset_password', false);
    } catch (error) {
      Server.log(['OAuth2.0_ERROR'], error);
      return false;
    }
  },
  // Will return byte of db mail
  FloMailInternalGetByteFromQuota: async (username) => {
    try {
      const url = `${AppsConstant.INTERNAL_MAIL_URL}/quota/item`;
      const result = await Request.Post(url, { username }, null, null, AppsConstant.INTERNAL_MAIL_REQUEST_TIMEOUT);
      if (result.statusCode !== 200) {
        return -1;
      }
      const body = typeof result.body === 'string'
        ? JSON.parse(result.body)
        : result.body;
      const byteValue = Number(_.get(body, 'bytes', -1));
      return byteValue;
    } catch (error) {
      Server.log(['OAuth2.0_ERROR'], error);
      return -1;
    }
  },

  GetTestGroupType: (username, internalGroup) => {
    const testGroups = OAuth2Constant.TEST_CONFIG_GROUPS;
    if (internalGroup) {
      for (let group of testGroups) {
        if (internalGroup == group.internalGroup) {
          return group;
        }
      };
    } else {
      for (let group of testGroups) {
        if (username.indexOf(group.prefix) == 0) {
          return group;
        }
      };
    }
    return {};
  }
};
module.exports = InternalAccountService;
