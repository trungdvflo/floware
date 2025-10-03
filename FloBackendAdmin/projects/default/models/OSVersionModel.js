const config = {
  tableName: 'os_version'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const AppToken = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        os_name: DataTypes.STRING,
        os_version: DataTypes.STRING,
        os_type: DataTypes.TINYINT,
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    return AppToken;
  }
};

module.exports = Model;
