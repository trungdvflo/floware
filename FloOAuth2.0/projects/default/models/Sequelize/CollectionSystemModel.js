
const config = {
  tableName: 'collection_system',
  model: 'CollectionSystemModel'
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
        type: DataTypes.BIGINT
      },
      name: {
        type: DataTypes.STRING,
        require: true
      },
      type: {
        type: DataTypes.TINYINT,
        default: 0,
        require: true
      },
      enable_mini_month: {
        type: DataTypes.TINYINT,
      },
      enable_quick_view: {
        type: DataTypes.TINYINT,
      },
      show_mini_month: {
        type: DataTypes.TINYINT,
      },
      local_filter: {
        type: DataTypes.JSON
      },
      sub_filter: {
        type: DataTypes.JSON
      },
      is_default: {
        type: DataTypes.TINYINT,
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
