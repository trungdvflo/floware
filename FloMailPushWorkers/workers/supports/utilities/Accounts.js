const _ = require('lodash');
const NodeRSA = require('node-rsa');
const Fse = require('fs-extra');

const Accounts = {

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
  }
};
module.exports = Accounts;
