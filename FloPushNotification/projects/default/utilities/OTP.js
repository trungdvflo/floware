const speakeasy = require('speakeasy');

const OTP = {

    generateSecretKey(length = 16) {
        const secret = speakeasy.generateSecret({ length });
        return secret.base32;
    },

    getOTP(secretKey) {
        const otp = speakeasy.totp({
            secret: secretKey,
            encoding: 'base32'
            // step: 30
        });
        return otp;
    },

    verify(secretKey, otp, expiry = 300) {
        const verified = speakeasy.totp.verify({
            secret: secretKey,
            encoding: 'base32',
            token: otp,
            // step: 60,
            window: expiry / 30
        });

        return verified;
    },

    getTimeUpdateOTP() {
        return Math.round(new Date().getTime() / 1000) % 30;
    }
};

module.exports = OTP;
