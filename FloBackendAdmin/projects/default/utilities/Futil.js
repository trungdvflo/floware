/* eslint-disable no-mixed-operators */
/* eslint-disable no-bitwise */
const pathUtil = require('path');
const _ = require('lodash');
const NodeRSA = require('node-rsa');
const Fs = require('fs');
const AppsConstant = require('../constants/AppsConstant');
const { generateRandomDecimal } = require('./Utils');
module.exports = {
  // get imap or smtp password from the user entity
  PassFromUser(user, type) {
    let pass;
    const emailType = type || 'imap';
    if (emailType === 'imap' || emailType === 'smtp') {
      if (!user.pwdAtSign) {
        pass = this.decrypt(user.pass_income);
      } else {
        pass = this.decrypt(user.pass_income, {
          pwdAtSign: true
        });
      }
    }

    return pass;
  },

  /**
   * This function fixes the issues in which you can't send message after creating a new account on 123flo.
   * It is due to improper config of the DNS system.
   * In common case, you don't need a workaround like that as it may take down the entire email system.
   * So just return the original host here.
   */
  GetHost(host) {
    return host;
  },

  // return the location of the file on the server
  GetFileLocation(opts) {
    let userId;
    if (opts.req) userId = opts.req.user.user_id;
    else userId = opts.userId;

    // eslint-disable-next-line prefer-rest-params
    const params = Array.prototype.slice.call(arguments, 1);
    let identity = [];

    identity.push(`${userId}`);

    if (opts.email) {
      identity = identity
        .concat(params.slice(0, 1))
        .concat(opts.email.replace('@', '_'))
        .concat(params.slice(1));
    } else if (opts.type && opts.type === 'VJOURNAL') {
      identity = identity.concat(params);
    } else {
      identity = identity.concat(params);
    }
    const basePath = AppsConstant.PATH_UPLOAD;
    return pathUtil.join.apply(null, [basePath].concat(identity));
  },
  Encrypt: (message) => {
    try {
      const RSA = new NodeRSA();
      const publicKey = Fs.readFileSync(AppsConstant.RSA.PRIVATE_KEY, 'utf8');
      RSA.importKey(publicKey);
      RSA.setOptions({
        encryptionScheme: 'pkcs1'
      });
      return RSA.encrypt(message, 'base64');
    } catch (err) {
      throw new Error(`Could not encrypt the data: ${err}`);
    }
  },

  Decrypt(encoded, opts) {
    const data = opts ? _.clone(opts) : {};
    let filePath = '';
    let encodedData = _.clone(encoded);
    const key = new NodeRSA();
    const privateKey = Fs.readFileSync(AppsConstant.RSA.PRIVATE_KEY, 'utf8');
    key.importKey(privateKey);
    key.setOptions({
      encryptionScheme: 'pkcs1'
    });
    if (data.specialBase64) {
      encodedData = encoded.replace(/_/g, '/').replace(/-/, '+');
    }

    try {
      filePath = key.decrypt(encodedData, 'utf8');
      if (data.pwdAtSign) {
        return this.extractPass(filePath);
      }
    } catch (err) {
      throw new Error(`Could not decrypt the data: ${err}`);
    }

    return filePath;
  },

  generateUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = generateRandomDecimal() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
};
