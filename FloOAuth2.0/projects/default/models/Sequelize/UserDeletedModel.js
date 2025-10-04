const config = {
  tableName: 'user_deleted',
  model: 'UserDeletedModel'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const UsersDeleted = sequelize.define(config.model, {
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
      is_disabled: {
        type: DataTypes.INTEGER
      },
      progress: {
        type: DataTypes.INTEGER,
        default: false
      },
      cleaning_date: {
        type: DataTypes.DOUBLE(13, 3),
        required: true
      },
      created_date: {
        type: DataTypes.DOUBLE(13, 3),
        require: true
      }
    }, config);
    return UsersDeleted;
  }
};

module.exports = Model;
