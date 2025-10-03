module.exports = {
    active: true,
    host: process.env.HOST,
    port: process.env.PORT,
    cors: {
        origin: ['*'],
        additionalHeaders: ['access-control-allow-origin', 'keyapi', 'signature', 'otp', 'authorization']
    }
};

