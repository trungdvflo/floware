const _ = require('lodash');
const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const store = {
    caches: [],
    connections: {}
};

const commands = {
    async setNX(key, value, ttl = null) {
        return new Promise(((resolve, reject) => {
            try {
                const { server, adapter } = this;
                if (_.isNull(ttl) === true) {
                    server.set(key, value, 'NX', (error, reply) => {
                        if (error) { reject(error); }
                        resolve(reply === 'OK');
                    });
                } else {
                    server.set(key, value, 'NX', 'EX', parseInt(ttl, 10), (error, reply) => {
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
                const { server, adapter } = this;
                if (_.isNull(ttl) === true) {
                    server.set(key, value, (error, reply) => {
                        if (error) { reject(error); }
                        resolve(reply === 'OK');
                    });
                } else {
                    server.set(key, value, 'EX', parseInt(ttl, 10), (error, reply) => {
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
                const { server, adapter } = this;
                if (adapter === 'redis') {
                    server.getAsync(key).then((res) => {
                        resolve(res);
                    });
                }
            } catch (error) {
                reject(error);
            }
        }));
    },

    async del(key) {
        try {
            const { server, adapter } = this;
            if (adapter === 'redis') {
                const result = await server.del(key);
                return result;
            }
            return false;
        } catch (e) {
            throw e;
        }
    },

    async wrap(key, work, ttl = null) {
        const { server, adapter } = this;
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
                            server: redis.createClient(v.options.config)
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
