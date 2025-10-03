const config = {
  tableName: 'app_token'
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
        app_pregId: {
          type: DataTypes.STRING,
          field: 'app_preg_id'
        },
        key_api: DataTypes.STRING,
        time_expire: DataTypes.INTEGER,
        created_time: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        token: DataTypes.STRING,
        email: DataTypes.STRING
      },
      config
    );

    return AppToken;
  }
};

module.exports = Model;
