const config = {
  tableName: 'user_deleted',
  timestamps: false
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const UsersDeleted = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: DataTypes.BIGINT,
          default: 0,
          required: true
        },
        username: {
          type: DataTypes.STRING,
          required: true
        },
        is_disabled: {
          type: DataTypes.TINYINT
        },
        progress: {
          type: DataTypes.TINYINT
        },
        cleaning_date: {
          type: DataTypes.DOUBLE(13, 3),
          required: true,
          default: 0.0
        },
        created_date: {
          type: DataTypes.DOUBLE(13, 3),
          required: true,
          default: 0.0
        }
      },
      config
    );
    return UsersDeleted;
  }
};

module.exports = Model;
