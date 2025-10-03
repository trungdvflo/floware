
const config = {
  tableName: 'device_token'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const DeviceToken = sequelize.define(config.tableName, {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: DataTypes.STRING,
        required: true
      },
      device_token: {
        type: DataTypes.STRING,
        required: true
      },
      device_type: {
        type: DataTypes.INTEGER
      },
      cert_env: {
        type: DataTypes.INTEGER
      },
      time_sent_silent: DataTypes.INTEGER,
      time_received_silent: DataTypes.INTEGER,
      status_app_run: DataTypes.INTEGER,
      env_silent: DataTypes.INTEGER,
      device_env: DataTypes.INTEGER
    }, config);

    return DeviceToken;
  }
};

module.exports = Model;
