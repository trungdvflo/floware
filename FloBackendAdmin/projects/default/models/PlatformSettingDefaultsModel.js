const config = {
  tableName: 'platform_setting_default'
};

const Model = {
  datastore: 'flowdataSequelize',
  tableName: config.tableName,
  attributes: (sequelize, DataTypes) => {
    const PlatformSettingDefaults = sequelize.define(
      config.tableName,
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        app_reg_id: DataTypes.STRING,
        app_version: DataTypes.STRING,
        data_setting: DataTypes.JSON,
        created_date: DataTypes.DOUBLE(13, 3),
        updated_date: DataTypes.DOUBLE(13, 3)
      },
      config
    );

    return PlatformSettingDefaults;
  }
};

module.exports = Model;
