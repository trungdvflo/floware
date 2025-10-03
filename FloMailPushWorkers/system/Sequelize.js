const Path = require('path');
const _ = require('lodash');
const Sequelize = require('sequelize');

const sequelize = {};
const store = {
  models: [],
  connections: {}
};

module.exports.ApplyModel = (model, path, projectBasePath) => {
  const tmpModel = model;
  const modelName = Path.basename(path, 'Model.js');

  if (_.get(model, 'tableName', false) === false) {
    tmpModel.tableName = modelName;
  }

  store.models.push({
    tableName: tmpModel.tableName,
    model: tmpModel,
    path,
    projectBasePath
  });
};

module.exports.Start = (connections) => {
  try {
    return new Promise((resolve, reject) => {
      _.forEach(connections, (v, k) => {
        try {
          if (v.engine === 'sequelize') {
            store.connections[k] = v.options;
            const options = _.clone(v.options);
            const config = {
              host: options.host,
              port: options.port,
              dialect: options.adapter,
              maxConcurrentQueries: options.maxConcurrentQueries,
              logging: options.debug ? console.log : false,
              raw: true,
              pool: {
                max: options.max,
                min: options.min,
                acquire: options.acquire,
                idle: options.idle
              },
              define: {
                underscored: options.underscored,
                freezeTableName: options.freezeTableName,
                syncOnAssociation: options.syncOnAssociation,
                charset: options.charset,
                collate: options.collate,
                timestamps: options.timestamps
              }

            };

            delete options.uri;
            sequelize[k] = new Sequelize(options.database, options.user, options.password, config);
          }
        } catch (e) {
          reject(e);
        }
      });
      const db = {};

      _.forEach(store.models, (v) => {
        try {
          const { model, path } = v;
          const { attributes } = require(path);
          // const Init = sequelize[model.datastore].import(model.tableName, attributes);
          const Init = attributes(sequelize[model.datastore], Sequelize.DataTypes);
          db[Init.name] = Init;
        } catch (e) {
          reject(e);
        }
      });

      Object.keys(db).forEach((modelName) => {
        const model = _.find(store.models, { tableName: modelName });
        if (db[modelName].associate) {
          db[modelName].associate(db);
        }
        require.cache[model.path].exports = db[modelName];
      });

      resolve(true);
    });
  } catch (error) {
    return error;
  }
};
