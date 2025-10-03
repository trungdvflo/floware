
module.exports = {
  reporters: {
    mySentryReporter: [{
      module: '@hapi/good-squeeze',
      name: 'Squeeze',
      args: [{ log: '*' }]
    }, {
      module: require('../utilities/logs/Sentry'),
      args: [{
        name: 'Flo_mail_push_workers',
        dsn: process.env.LOG_SENTRY_DSN,
        environment: process.env.NODE_ENV
      }]
    }],
    GrayLog: [{
      module: '@hapi/good-squeeze',
      name: 'Squeeze',
      args: [{
        log: '*',
        response: '*'
      }]
    }, {
      module: require('../utilities/logs/Graylog'),
      args: [{
        host: process.env.LOG_GRAYLOG_HOST,
        port: process.env.LOG_GRAYLOG_PORT,
        facility: 'Flo_mail_push_workers'
      }]
    }]
  }
};
