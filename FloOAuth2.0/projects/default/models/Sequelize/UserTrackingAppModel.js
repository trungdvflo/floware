const config = {
  tableName: 'user_tracking_app',
  model: 'UserTrackingAppModel'
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
        required: true
      },
      username: {
        type: DataTypes.STRING,
        required: true
      },
      tracking_app_id: {
        type: DataTypes.BIGINT,
        required: true
      },
      last_used_date: {
        type: DataTypes.DOUBLE(13, 3)
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
