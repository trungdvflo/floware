const _ = require('lodash');
const RedisConnection = require('./RedisConnection')

const store = {
  caches: [],
  connections: {}
};

const commands = {
  getConnection() {
    return this.server;
  },
  async set(key, value, ttl = null) {
    const { server } = this;
    const reply = await server.set(key, value);
    if (reply === 'OK') {
      if (_.isNull(ttl) === false) {
        await server.expire(key, parseInt(ttl, 10));
      }
      return true;
    }
    return false;
  },

  async get(key) {
    const { server } = this;
    const res = await server.get(key);
    return res;
  },

  async del(key) {
    const { server } = this;
    const result = await server.del(key);
    return result;
  },

  async wrap(key, work, ttl = null) {
    const result = await server.get(key);
    if (_.isNull(result) === false) {
      return result;
    }
    const data = await work();
    if (data) {
      if (_.isNull(ttl) === true) {
        await server.set(key, data);
      } else {
        await server.set(key, data, ttl);
      }
    }
    return data;
  }
};

module.exports.ApplyCache = (cache, path, projectBasePath) => {
  store.caches.push({
    cache,
    path,
    projectBasePath
  });
};




module.exports.Start = (connections) => {
  return new Promise((resolve, reject) => {
    _.forEach(connections, (v, k) => {
      try {
        if (v.engine === 'cache') {
          if (v.options.adapter === 'redis') {
            const redisClient = RedisConnection.getInstance(v.options.config);
            store.connections[k] = {
              server: redisClient
            };
          }
        }
        return true;
      } catch (e) {
        return reject(e);
      }
    });

    _.forEach(store.caches, (v) => {
      try {
        const cache = require(v.path);
        const connection = `${cache.connection}`;
        const bindCommand = {};

        _.forEach(commands, (func, funcName) => {
          bindCommand[funcName] = func.bind(
            store.connections[connection]
          );
        });
        require.cache[v.path].exports = bindCommand;
        _.forEach(cache, (func, funcName) => {
          if (_.isFunction(func) === true) {
            require.cache[v.path].exports[funcName] = func.bind(
              bindCommand
            );
          }
        });
      } catch (e) {
        reject(e);
      }
    });

    resolve(true);
  });
};