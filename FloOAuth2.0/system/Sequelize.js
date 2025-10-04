const Path = require('path');
const _ = require('lodash');
const Sequelize = require('sequelize');

const sequelize = {
};
const store = {
  models: [],
  connections: {
  }
};

module.exports.ApplyModel = (model, path, projectBasePath) => {
  const tmpModel = model;
  const modelName = Path.basename(path, '.js');

  store.models.push({
    modelName,
    tableName: tmpModel.tableName,
    model: tmpModel,
    path,
    projectBasePath
  });
};

const DefaultConfig = (options, pool) => {
  return {
    host: options.host,
    port: options.port,
    dialect: options.adapter,
    maxConcurrentQueries: options.maxConcurrentQueries,
    logging: options.debug ? console.log : false,
    raw: true,
    pool,
    define: {
      underscored: options.underscored,
      freezeTableName: options.freezeTableName,
      syncOnAssociation: options.syncOnAssociation,
      charset: options.charset,
      collate: options.collate,
      timestamps: options.timestamps
    },
    benchmark: !!options.debug
  };
};

const ReplicationConfig = (options, pool) => {
  const replicationWriteOptions = _.get(options, 'replication.write', false);
  if (_.isEmpty(replicationWriteOptions) === true) {
    return {
      replication: false,
      data: DefaultConfig(options, pool)
    };
  }

  let replicationReadOptions = _.get(options, 'replication.read', false);
  if (_.isEmpty(replicationReadOptions) === true) {
    replicationReadOptions = [{
      ...replicationWriteOptions 
    }];
  }

  return {
    replication: true,
    data: {
      dialect: options.adapter,
      replication: {
        write: {
          host: replicationWriteOptions.host,
          port: replicationWriteOptions.port,
          username: replicationWriteOptions.user,
          password: replicationWriteOptions.password
        },
        read: replicationReadOptions.map((item) => {
          return {
            host: item.host,
            port: item.port,
            username: item.user,
            password: item.password
          };
        })
      },
      maxConcurrentQueries: options.maxConcurrentQueries,
      logging: options.debug ? console.log : false,
      raw: true,
      pool,
      define: {
        underscored: options.underscored,
        freezeTableName: options.freezeTableName,
        syncOnAssociation: options.syncOnAssociation,
        charset: options.charset,
        collate: options.collate,
        timestamps: options.timestamps
      },
      benchmark: !!options.debug
    }
  };
};

const GetConfig = (options, pool) => {
  if (_.isEmpty(options.replication) === true) {
    return {
      replication: false,
      data: DefaultConfig(options, pool)
    };
  }
  return ReplicationConfig(options, pool);
};

module.exports.Start = (connections) => {
  try {
    return new Promise((resolve, reject) => {
      _.forEach(connections, (v, k) => {
        try {
          if (v.engine === 'sequelize') {
            store.connections[k] = v.options;
            const options = _.clone(v.options);
            const pool = {
              max: options.max
            };
            if (options.min) {
              pool.min = options.min;
            }
            if (options.acquire) {
              pool.acquire = options.acquire;
            }
            if (options.idle) {
              pool.idle = options.idle;
            }
            const config = GetConfig(options, pool);

            if (config.replication === false) {
              sequelize[k] = new Sequelize(options.database, options.user, options.password, config.data);
            } else {
              sequelize[k] = new Sequelize(options.database, null, null, config.data);
            }
          }
        } catch (e) {
          reject(e);
        }
      });
      const db = {
      };

      _.forEach(store.models, (v) => {
        try {
          const { modelName, model, path } = v;
          db[modelName] = require(path).attributes(sequelize[model.datastore], Sequelize.DataTypes);
        } catch (e) {
          reject(e);
        }
      });

      Object.keys(db).forEach((modelName) => {
        if ('associate' in db[modelName]) {
          db[modelName].associate(db);
        }
        const model = _.find(store.models, {
          modelName 
        });
        require.cache[model.path].exports = db[modelName];
      });
      resolve(true);
    });
  } catch (error) {
    return error;
  }
};
