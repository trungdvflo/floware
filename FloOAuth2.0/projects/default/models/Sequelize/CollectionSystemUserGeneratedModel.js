
const config = {
  tableName: 'collection_system_user_generated',
  model: 'CollectionSystemUserGeneratedModel'

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
      email: {
        type: DataTypes.STRING,
        required: true
      },
      created_date: {
        type: DataTypes.DOUBLE(13, 3),
        default: 0.000,
        require: true
      },
      updated_date: {
        type: DataTypes.DOUBLE(13, 3)
      }
    }, config);
  }
};

module.exports = Model;
