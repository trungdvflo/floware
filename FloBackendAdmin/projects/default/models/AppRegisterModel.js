const config = {
  tableName: 'app_register'
};
const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const AppRegister = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        app_reg_id: {
          type: DataTypes.STRING
        },
        app_alias: DataTypes.STRING,
        email_register: DataTypes.STRING,
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3),
        app_name: DataTypes.STRING
      },
      config
    );

    return AppRegister;
  }
};

module.exports = Model;
