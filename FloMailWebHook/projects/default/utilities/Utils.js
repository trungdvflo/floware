const _ = require('lodash');
const Md5 = require('md5');
const NodeRSA = require('node-rsa');
const Randomstring = require('randomstring');
const Fse = require('fs-extra');
const AppsConstant = require('../constants/AppsConstant');

const Utils = {

  HandlePaging: (pageNum, maxRow = 50) => {
    try {
      if (_.isNumber(pageNum) === true && _.isNumber(maxRow) === true) {
        if (pageNum > 0 && maxRow > 0) {
          return {
            limit: maxRow,
            offset: (pageNum - 1) * maxRow
          };
        }
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  GetUtcMillisecond: () => {
    return new Date(new Date().toUTCString()).valueOf();
  },

  // format 1568269168.587
  TimestampDouble: (millisecond = Utils.GetUtcMillisecond()) => {
    try {
      if (_.isNumber(millisecond) === true && millisecond.toString().length >= 10) {
        return millisecond / 1000;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  // format 1568269168
  TimestampInteger: (millisecond = Utils.GetUtcMillisecond()) => {
    try {
      if (_.isNumber(millisecond) === true && millisecond.toString().length >= 10) {
        return Math.round(millisecond / 1000);
      }
      return false;
    } catch (error) {
      return false;
    }
  },
  // format 1568269168587
  Timestamp: (millisecond = Utils.GetUtcMillisecond()) => {
    try {
      if (_.isNumber(millisecond) === true && millisecond.toString().length >= 10) {
        return millisecond;
      }
      return false;
    } catch (error) {
      return false;
    }
  },

  SubString: (str, length = 0, suffix = '...') => {
    if (_.isString(str) === false || _.isNumber(length) === false || length <= 0) {
      return '';
    }
    if (_.isEmpty(suffix) === false && str.length > length) {
      return `${str.trim().substr(0, length).trim()}${suffix}`;
    }

    return str.trim().substr(0, length).trim();
  },

  getAccessTokenOAuth2: (accessToken) => {
    let str = accessToken;
    str = str.trim(str);
    str = str.split(' ');
    return str[str.length - 1];
  },

  MD5DavPassword: (userName, realNameDav, pass) => {
    return Md5(`${userName}:${realNameDav}:${pass}`);
  },

  MD5Token: (userName, pass) => {
    const time = Utils.TimestampDouble();
    return Md5(`${userName}${pass}${time.toString()}${Randomstring.generate()}`);
  },

  DecryptStringWithRsaPrivateKey: (encrypted) => {
    try {
      if (_.isEmpty(encrypted) === true) {
        return false;
      }
      const RSA = new NodeRSA();
      const privateKey = Fse.readFileSync(process.env.RSA_PRIVATE_KEY_PATH, 'utf8');
      RSA.importKey(privateKey);
      RSA.setOptions({ encryptionScheme: 'pkcs1' });
      return RSA.decrypt(encrypted, 'utf8');
    } catch (error) {
      return false;
    }
  },

  CachePatterns: (func, key, user = null) => {
    let mainKey = `${AppsConstant.MAIN_KEY_CACHE}:${func}:${key}`;
    if (user !== null) {
      mainKey = `${AppsConstant.MAIN_KEY_CACHE}:${user}:${func}:${key}`;
    }
    return mainKey;
  },

};
module.exports = Utils;
