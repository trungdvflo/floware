const fs = require('fs-extra');
const path = require('path');
const Sequelize = require('sequelize');
const Connection = require('./Connection');

const db = {};

const config = {
  host: Connection.Sequelize.host,
  port: Connection.Sequelize.port,
  dialect: Connection.Sequelize.adapter,
  maxConcurrentQueries: Connection.Sequelize.maxConcurrentQueries,
  logging: true,
  raw: true,
  pool: {
    max: Connection.Sequelize.max,
    min: Connection.Sequelize.min,
    acquire: Connection.Sequelize.acquire,
    idle: Connection.Sequelize.idle
  },
  define: {
    underscored: Connection.Sequelize.underscored,
    freezeTableName: Connection.Sequelize.freezeTableName,
    syncOnAssociation: Connection.Sequelize.syncOnAssociation,
    charset: Connection.Sequelize.charset,
    collate: Connection.Sequelize.collate,
    timestamps: Connection.Sequelize.timestamps
  }
};

let instance = null;
const dbConnection = (() => {
  function createInstance() {
    return new Sequelize(
      Connection.Sequelize.database,
      Connection.Sequelize.user,
      Connection.Sequelize.password,
      config
    );
  }
  return {
    getInstance: () => {
      if (!instance) {
        instance = createInstance();
      }
      return instance;
    }
  };
})();

const sequelize = dbConnection.getInstance();
const modelDir = `${__dirname}/../../projects/default/models/`;

const listFileModel = [];
fs.readdirSync(modelDir).filter((file) => {
  return file.indexOf('.') !== 0 && file !== 'index.js';
}).forEach((file) => {
  const filePath = path.join(modelDir, file);
  const { attributes } = require(filePath.replace('.js', ''));
  const model = attributes(sequelize, Sequelize.DataTypes);
  db[model.name] = model;
  listFileModel[model.name] = filePath;
});

Object.keys(db).forEach((modelName) => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
  require.cache[listFileModel[modelName]].exports = db[modelName];
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
