// Nodejs encryption with CTR
const crypto = require('crypto');
const AppsConstant = require('../constants/AppsConstant');

const algorithm = AppsConstant.AES_ALGORITHM;

function aes256Encrypt(text, key, iv) {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted.toString('hex');
}

function aes256Decrypt(text, key, iv) {
  const encryptedText = Buffer.from(text, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function aes256EncryptBuffer(text, key, iv) {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted;
}

function aes256DecryptBuffer(text, key, iv) {
  const encryptedText = Buffer.from(text, 'hex');
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}

module.exports = {
  aes256Encrypt,
  aes256Decrypt,
  aes256EncryptBuffer,
  aes256DecryptBuffer
};
