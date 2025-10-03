const crypto = require('crypto');
require('dotenv').config(); // Load environment variables

// Function to generate a secret key (once per day) with a salt
function generateSecretKey4ThisDay() {
  try {
    const date = new Date();
    const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    
    // Use a salt from the environment variable
    const salt = process.env.SECRET_KEY_SALT || 'ANPH_SALT'; // Use a default salt if not provided

    const key = crypto.createHash('sha256').update(dateString + salt).digest('hex');
    return Buffer.from(key, 'hex');
  } catch (error) {
    console.error('Error generating secret key:', error);
    throw error;
  }
}

// Function to encrypt text
function encrypt(text) {
  try {
    const key = generateSecretKey4ThisDay();
    const iv = crypto.randomBytes(16); // Initialization Vector
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('hex'),
      encryptedText: encrypted,
      authTag: authTag.toString('hex'),
    };
  } catch (error) {
    console.error('Error encrypting text:', error);
    throw error;
  }
}

// Function to decrypt text
function decrypt(encryptedData) {
  try {
    const key = generateSecretKey4ThisDay();
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(encryptedData.iv, 'hex'));

    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Error decrypting text:', error);
    throw error;
  }
}

// Example usage
const textToEncrypt = 'This is a large text that needs to be encrypted.';

try {
  const encryptedData = encrypt(textToEncrypt);
  console.log('Encrypted:', encryptedData);

  const decryptedText = decrypt(encryptedData);
  console.log('Decrypted:', decryptedText);
} catch (error) {
  console.error('An error occurred:', error);
}
