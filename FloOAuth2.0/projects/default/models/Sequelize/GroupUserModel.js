const config = {
  tableName: 'group_user',
  model: 'GroupUserModel'
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
      group_id: {
        type: DataTypes.BIGINT,
        required: true
      },
      group_name: {
        type: DataTypes.STRING,
      },
      user_id: {
        type: DataTypes.BIGINT,
        required: true
      },
      username: {
        type: DataTypes.STRING,
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
