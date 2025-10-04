const Redis = require('ioredis');
module.exports = (() => {
  let redisInstance;
  function createConnection(config) {
    return new Redis(config);
  }
  return {
    getInstance: (config) => {
      if (!redisInstance || redisInstance.status === 'end') {
        redisInstance = createConnection(config);
      }
      return redisInstance;
    }
  };
})();