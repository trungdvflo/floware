const config = {
  tableName: 'tracking_app',
  model: 'TrackingAppModel'
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
      name: {
        type: DataTypes.STRING,
        default: null
      },
      app_version: {
        type: DataTypes.STRING,
        default: null
      },
      flo_version: {
        type: DataTypes.STRING,
        default: null
      },
      app_id: {
        type: DataTypes.STRING,
        default: null
      },
      build_number: {
        type: DataTypes.STRING,
        default: null
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

