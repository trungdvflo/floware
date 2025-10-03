import {
  constants, createCipheriv, createDecipheriv,
  createHash, privateDecrypt, publicEncrypt
} from 'crypto';
const algorithm = 'aes-256-cbc';
export class CryptoUtil {
  static converToMd5(email: string) {
    const userIdMd5 = createHash('md5').update(email).digest("hex");
    return userIdMd5;
  }
  static encryptPassWithPublicKey = (password: string) => {
    try {
      // const RSA_PUBLIC_KEY = process.env['RSA_PUBLIC_KEY_PATH']
      //  && fs.readFileSync(process.env['RSA_PUBLIC_KEY_PATH'], 'utf-8');
      const RSA_PUBLIC_KEY = process.env['RSA_PRIVATE_KEY'];
      const encrypted = publicEncrypt({
        key: RSA_PUBLIC_KEY,
        padding: constants.RSA_PKCS1_PADDING,
      }, Buffer.from(password));
      return encrypted.toString("base64");
    } catch (error) {
      return '';
    }
  }
  static decryptRSA(encryptedData) {
    const privateKey = process.env['RSA_PRIVATE_KEY'];
    const buffer = Buffer.from(encryptedData, "base64");
    const decrypted = privateDecrypt({
      key: privateKey, padding:
        constants.RSA_PKCS1_PADDING
    }, buffer);
    return decrypted.toString("utf8");
  }

  static aes256Encrypt(text: string, key: string = process.env.FLO_AES_KEY,
    iv: string = process.env.FLO_AES_IV_KEY): string {
    const cipher = createCipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted.toString('hex');
  }
  static aes256Decrypt(text: string, key: string = process.env.FLO_AES_KEY,
    iv: string = process.env.FLO_AES_IV_KEY): string {
    const encryptedText = Buffer.from(text, 'hex');
    const decipher = createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  static aes256EncryptBuffer(text: string, key: string, iv: string): Buffer {
    const cipher = createCipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return encrypted;
  }
  static aes256DecryptBuffer(text: Buffer, key: string, iv: string): string {
    const decipher = createDecipheriv(algorithm, Buffer.from(key, 'hex'), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(text);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }
}
