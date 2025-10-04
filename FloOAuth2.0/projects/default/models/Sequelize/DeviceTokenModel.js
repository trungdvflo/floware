
const config = {
  tableName: 'device_token',
  model: 'DeviceTokenModel'
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
      user_id: {
        type: DataTypes.BIGINT,
        default: 0
      },
      device_token: {
        type: DataTypes.STRING,
        required: true
      },
      device_type: {
        type: DataTypes.INTEGER,
        default: 0,
        required: true
      },
      time_sent_silent: {
        type: DataTypes.INTEGER,
        default: 0,
        required: true
      },
      time_received_silent: {
        type: DataTypes.INTEGER,
        default: 0,
        required: true
      },
      status_app_run: {
        type: DataTypes.INTEGER,
        default: 0,
        required: true
      },
      cert_env: {
        type: DataTypes.INTEGER,
        default: 0
      },
      env_silent: {
        type: DataTypes.INTEGER,
        default: 0,
        required: true
      },
      device_env: {
        type: DataTypes.INTEGER,
        default: 0,
        required: true
      },
      created_date: {
        type: DataTypes.DOUBLE(13, 3),
        require: true
      },
      updated_date: {
        type: DataTypes.DOUBLE(13, 3),
        default: 0.000
      }
    }, config);
  }
};

module.exports = Model;
