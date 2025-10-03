const config = {
  tableName: 'config'

};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const configPushSilent = sequelize.define(config.tableName, {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      group: DataTypes.STRING,
      key: DataTypes.STRING,
      value: DataTypes.JSON

    }, config);

    return configPushSilent;
  }
};

module.exports = Model;
