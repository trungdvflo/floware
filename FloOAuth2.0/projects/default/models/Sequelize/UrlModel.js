
const config = {
  tableName: 'url',
  model: 'UrlModel'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const Url = sequelize.define(config.model, {
      id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.BIGINT,
        required: true
      },
      url: {
        type: DataTypes.TEXT
      },
      uid: {
        type: DataTypes.STRING
      },
      title: {
        type: DataTypes.TEXT
      },
      order_number: {
        type: DataTypes.INTEGER,
        default: 0,
        required: true
      },
      order_update_time: {
        type: DataTypes.DOUBLE(13, 3),
        default: 0.000,
        required: true
      },
      is_trashed: {
        type: DataTypes.INTEGER,
        default: 0,
        require: true
      },
      recent_date: {
        type: DataTypes.DOUBLE(13, 3),
        default: 0.000
      },
      created_date: {
        type: DataTypes.DOUBLE(13, 3),
        default: 0.000
      },
      updated_date: {
        type: DataTypes.DOUBLE(13, 3),
        default: 0.000
      }
    }, config);
    return Url;
  }
};

module.exports = Model;
