const config = {
  tableName: 'api_last_modified',
  model: 'ApiLastModifiedModel'

};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    return sequelize.define(config.model, {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: DataTypes.INTEGER,
        required: true
      },
      api_name: {
        type: DataTypes.TEXT,
        required: true
      },
      api_last_modified: DataTypes.DOUBLE(13, 3),
      created_date: DataTypes.DOUBLE(13, 3),
      updated_date: DataTypes.DOUBLE(13, 3)
    }, config);
  }
};

module.exports = Model;
