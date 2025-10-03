// Nodejs encryption with CTR
import crypto from 'crypto';
import * as fs from "fs";
const algorithm = 'aes-256-gcm';

export function createMd5Digest(email: string) {
  const hash = crypto.createHash('md5');
  hash.update(email);
  return hash.digest('hex');
}

export function aes256EncryptBuffer(text: string, key: string, iv: string): Buffer {
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return encrypted;
}

export function aes256DecryptBuffer(text: Buffer, key: string, iv: string): string {
  const decipher = crypto.createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
  let decrypted = decipher.update(text);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

export function decryptRSA(rsa: string): string {
  const privKey = fs.readFileSync(process.env['RSA_PRIVATE_KEY_PATH']).toString();
  return crypto.privateDecrypt({
    key: privKey || '',
    padding: crypto.constants.RSA_PKCS1_PADDING,
  }, Buffer.from(rsa, 'base64')).toString();
}

/**
 * replace Math.random() for security bug
 * @returns Math.random()
 */
 const MAX_INTEGER = 2147483647;
 export function randUtil() {
  const buf = crypto.randomBytes(4);
  const value = Math.abs(buf.readInt32LE());
  return value/MAX_INTEGER;
}
