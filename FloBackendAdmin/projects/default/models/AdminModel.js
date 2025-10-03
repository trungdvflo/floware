const config = {
  tableName: 'admin'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const Admin = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        email: DataTypes.STRING,
        verify_code: DataTypes.STRING,
        time_code_expire: {
          type: DataTypes.INTEGER,
          default: 0,
          required: true
        },
        role: {
          type: DataTypes.TINYINT(4),
          default: 0,
          required: true
        },
        role_id: {
          type: DataTypes.BIGINT,
          default: 0,
          required: true
        },
        created_date: {
          type: DataTypes.DOUBLE(13, 3),
          default: 0.0
        },
        updated_date: {
          type: DataTypes.DOUBLE(13, 3),
          default: 0.0
        }
      },
      config
    );
    return Admin;
  }
};

module.exports = Model;
