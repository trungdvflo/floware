
const config = {
  tableName: 'timezone',
  model: 'TimezoneModel'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    return sequelize.define(config.model, {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      city: {
        type: DataTypes.STRING,
        required: true
      },
      country: {
        type: DataTypes.STRING,
        required: true
      },
      timezone: {
        type: DataTypes.STRING,
        required: true
      }
    }, config);
  }
};

module.exports = Model;
