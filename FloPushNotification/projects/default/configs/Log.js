module.exports = {
    reporters: {
        myConsoleReporter: [{
            module: '@hapi/good-squeeze',
            name: 'Squeeze',
            args: [{
                log: ['error'],
                response: '*'
            }]
        }, {
            module: 'good-hapi-graylog2',
            args: [{
                host: process.env.GRAYLOG_HOST,
                port: process.env.GRAYLOG_PORT,
                facility: 'nodejs_v3.2.0',
                hostname: process.env.GRAYLOG_HOST
            }]
        }]
    },
    includes: {
        request: ['headers'],
        response: ['payload']
    }
};
