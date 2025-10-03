const _ = require('lodash');
const IoRedis = require('ioredis');

const store = {
  caches: [],
  connections: {}
};

const commands = {
  async set(key, value, ttl = null) {
    const { server } = this;
    const { adapter } = this;
    if (adapter === 'redis') {
      let result;
      if (_.isNull(ttl) === true) {
        result = await server.set(key, value);
      } else {
        result = await server.set(key, value, 'EX', parseInt(ttl, 10));
      }

      return result;
    }
    return false;
  },

  async get(key) {
    const { server } = this;
    const { adapter } = this;
    if (adapter === 'redis') {
      const result = await server.get(key);
      return result;
    }
    return false;
  },
  async del(...keys) {
    const { server } = this;
    const { adapter } = this;
    if (adapter === 'redis') {
      await server.del(keys);
      return true;
    }
    return false;
  },

  async wrap(key, work, ttl = null) {
    const { server } = this;
    const { adapter } = this;
    if (adapter === 'redis') {
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
    return false;
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
            store.connections[k] = {
              adapter: 'redis',
              server: new IoRedis(v.options.config)
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
          bindCommand[funcName] = func.bind(store.connections[connection]);
        });
        require.cache[v.path].exports = bindCommand;
        _.forEach(cache, (func, funcName) => {
          if (_.isFunction(func) === true) {
            require.cache[v.path].exports[funcName] = func.bind(bindCommand);
          }
        });
      } catch (e) {
        reject(e);
      }
    });

    resolve(true);
  });
};
