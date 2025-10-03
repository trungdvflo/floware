const _ = require('lodash');
const redis = require('redis');
const bluebird = require('bluebird');
const Connection = require('./Connection');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const commands = {
  async setNX(key, value, ttl = null) {
    return new Promise(((resolve, reject) => {
      try {
        if (_.isNull(ttl) === true) {
          this.set(key, value, 'NX', (error, reply) => {
            if (error) { reject(error); }
            resolve(reply === 'OK');
          });
        } else {
          this.set(key, value, 'NX', 'EX', parseInt(ttl, 10), (error, reply) => {
            if (error) { reject(error); }
            resolve(reply === 'OK');
          });
        }
      } catch (error) {
        reject(error);
      }
    }));
  },

  async set(key, value, ttl = null) {
    return new Promise(((resolve, reject) => {
      try {
        if (_.isNull(ttl) === true) {
          this.set(key, value, (error, reply) => {
            if (error) { reject(error); }
            resolve(reply === 'OK');
          });
        } else {
          this.set(key, value, 'EX', parseInt(ttl, 10), (error, reply) => {
            if (error) { reject(error); }
            resolve(reply === 'OK');
          });
        }
      } catch (error) {
        reject(error);
      }
    }));
  },

  async get(key) {
    return new Promise(((resolve, reject) => {
      try {
        this.getAsync(key).then((res) => {
          resolve(res);
        });
      } catch (error) {
        reject(error);
      }
    }));
  },

  async del(key) {
    const result = await this.del(key);
    return result;
  },

  async wrap(key, work, ttl = null) {
    const result = await this.get(key);
    if (_.isNull(result) === false) {
      return result;
    }
    const data = await work();
    if (data) {
      if (_.isNull(ttl) === true) {
        await this.set(key, data);
      } else {
        await this.set(key, data, ttl);
      }
    }
    return data;
  }
};

let instance;
const ConnectionSingleton = (() => {
  function createConnection() {
    return redis.createClient(Connection.Redis);
  }
  return {
    getInstance: () => {
      if (!instance) {
        instance = createConnection();
      }
      return instance;
    }
  };
})();

// Usage:
const connection = ConnectionSingleton.getInstance();

const BindCommand = {};
_.forEach(commands, (func, funcName) => {
  BindCommand[funcName] = func.bind(connection);
});

module.exports = BindCommand;

