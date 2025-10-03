module.exports = {
  reporters: {
    myGraylogReporter: [{
      module: '@hapi/good-squeeze',
      name: 'Squeeze',
      args: [{
        error: '*',
        log: '*',
        response: '*'
      }]
    }, {
      module: require('../utilities/logs/Graylogs'),
      args: [{
        host: process.env.LOG_HOST,
        port: process.env.LOG_PORT,
        facility: 'FloAdmin_v4',
        bufferSize: 5e4
      }]
    }]
  },
  includes: {
    request: ['headers', 'payload'],
    response: ['headers', 'payload']
  }
};
