const config = {
  tableName: 'device_token'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const DeviceToken = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: DataTypes.BIGINT,
          required: true
        },
        device_token: {
          type: DataTypes.STRING,
          required: true
        }
      },
      config
    );

    return DeviceToken;
  }
};

module.exports = Model;
