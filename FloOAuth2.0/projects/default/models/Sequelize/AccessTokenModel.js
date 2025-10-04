
const config = {
  tableName: 'access_token',
  model: 'AccessTokenModel'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const AccessTokens = sequelize.define(config.model, {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.BIGINT,
        required: true
      },
      app_id: {
        type: DataTypes.INTEGER,
        required: true
      },
      device_uid: {
        type: DataTypes.STRING,
        required: true
      },
      device_token: {
        type: DataTypes.STRING,
        required: false
      },
      email: {
        type: DataTypes.STRING,
        required: true
      },

      access_token: {
        type: DataTypes.BLOB('tiny'),
        required: true
      },
      access_token_iv: {
        type: DataTypes.BLOB('tiny'),
        required: true
      },
      refresh_token: {
        type: DataTypes.BLOB('tiny'),
        required: true
      },
      refresh_token_iv: {
        type: DataTypes.BLOB('tiny'),
        required: true
      },
      previous_refresh_token: {
        type: DataTypes.BLOB('tiny'),
        default: ''
      },
      scope: {
        type: DataTypes.TEXT
      },
      token_type: {
        type: DataTypes.STRING,
        required: true
      },
      user_agent: {
        type: DataTypes.STRING,
        default: ''
      },
      ip: {
        type: DataTypes.STRING,
        default: ''
      },

      is_revoked: {
        type: DataTypes.INTEGER,
        default: 0
      },
      expires_in: {
        type: DataTypes.DOUBLE(22, 0),
        required: true
      },
      expires_in_refresh_token: {
        type: DataTypes.DOUBLE(22, 0),
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
    return AccessTokens;
  }
};

module.exports = Model;
