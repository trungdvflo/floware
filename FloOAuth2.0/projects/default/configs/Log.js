module.exports = {
  reporters: {
    GrayLog: [{
      module: '@hapi/good-squeeze',
      name: 'Squeeze',
      args: [{
        log: '*',
        response: '*'
      }]
    }, {
      module: require('../utilities/logs/Graylogs'),
      args: [{
        host: process.env.LOG_GRAYLOG_HOST,
        port: process.env.LOG_GRAYLOG_PORT,
        facility: 'Oauth2'
      }]
    }]
  },
  includes: {
    request: ['headers', 'payload'],
    response: ['headers', 'payload']
  }
};
